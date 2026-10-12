"use client";

import dynamic from "next/dynamic";
import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { HeroTitle } from "./HeroTitle";
import type { Flavor } from "./3d/WobbleScene";

const ProductArt = dynamic(() => import("./3d/ProductArt"), { ssr: false });
const WobbleScene = dynamic(() => import("./3d/WobbleScene"), { ssr: false });
const PlaygroundScene = dynamic(() => import("./3d/PlaygroundScene"), { ssr: false });

const products: { id: Flavor; name: string; price: string; note: string }[] = [
  { id: "latte", name: "Wobble Latte", price: "$6.50", note: "fruit jelly · oat cloud" },
  { id: "toast", name: "Jelly Toast", price: "$8.00", note: "thick toast · little jewels" },
  { id: "brew", name: "Cloud Cold Brew", price: "$5.75", note: "slow brew · soft cream" },
];

export default function LandingPage() {
  const [flavor, setFlavor] = useState<Flavor>("latte");
  const [wobbleCount, setWobbleCount] = useState(0);
  const [jellies, setJellies] = useState<{ id: number; x: number; color: string; rotation: number }[]>([]);
  const [removedInitialCount, setRemovedInitialCount] = useState(0);
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [heroReady, setHeroReady] = useState(false);
  const [siteLoaded, setSiteLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const plateFull = jellies.length + 6 - removedInitialCount >= 8;

  useEffect(() => {
    if (heroReady) {
      setLoadingProgress(100);
      const finish = window.setTimeout(() => setSiteLoaded(true), 600);
      return () => window.clearTimeout(finish);
    }
    const progress = window.setInterval(() => setLoadingProgress((value) => Math.min(90, value + (94 - value) * .12)), 160);
    return () => window.clearInterval(progress);
  }, [heroReady]);

  useEffect(() => {
    if (siteLoaded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [siteLoaded]);

  useEffect(() => {
    if (!siteLoaded) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = document.querySelectorAll<HTMLElement>(".menu-rail>*,.story-heading>*,.story-note,.story-intro,.story-lower,.playground-copy>*,.jelly-playground,.visit-inner>div,.footer-top>div,.footer-top form,.footer-bottom");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-revealed");
        else if (entry.boundingClientRect.top >= window.innerHeight || entry.boundingClientRect.bottom <= 0) entry.target.classList.remove("is-revealed");
      });
    }, { threshold: .12, rootMargin: "0px 0px -48px 0px" });
    elements.forEach((element) => {
      const siblingIndex = Array.from(element.parentElement?.children ?? []).indexOf(element);
      element.classList.add("scroll-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(Math.max(siblingIndex, 0), 3) * 90}ms`);
      observer.observe(element);
    });
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const progress = reducedMotion ? 0 : Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
        document.documentElement.style.setProperty("--hero-scroll", String(progress));
      });
    };
    window.addEventListener("scroll", update, { passive: true }); update();
    return () => { observer.disconnect(); window.removeEventListener("scroll", update); cancelAnimationFrame(frame); elements.forEach((e) => e.classList.remove("scroll-reveal", "is-revealed")); };
  }, [siteLoaded]);

  function moveTitle(event: ReactPointerEvent<HTMLElement>) {
    if (!titleRef.current || event.pointerType === "touch") return;
    for (const letter of titleRef.current.querySelectorAll<SVGElement>(".title-letter")) {
      const rect = letter.getBoundingClientRect();
      const distance = Math.abs(event.clientX - (rect.left + rect.width / 2));
      const lift = Math.max(0, 1 - distance / 200) * 15;
      letter.style.transform = `translateY(${-lift}px) rotate(${lift * (event.clientX < rect.left + rect.width / 2 ? -0.5 : 0.5)}deg)`;
    }
  }

  function resetTitle() {
    titleRef.current?.querySelectorAll<SVGElement>(".title-letter").forEach((letter) => { letter.style.transform = ""; });
  }

  function chooseProduct(next: Flavor) {
    setFlavor(next);
    setWobbleCount((value) => value + 1);
  }

  function dropJelly() {
    if (plateFull) return;
    const colors = ["#e78c86", "#f2bd4e", "#91b955", "#8db6c9", "#b58abe"];
    setJellies((current) => current.length + 6 - removedInitialCount >= 8 ? current : [...current, { id: Date.now() + Math.random(), x: 15 + Math.random() * 70, color: colors[Math.floor(Math.random() * colors.length)], rotation: Math.random() * 65 - 32 }]);
  }

  function removeJelly(id: number) {
    if (id < 0) setRemovedInitialCount((count) => Math.min(6, count + 1));
    else setJellies((current) => current.filter((jelly) => jelly.id !== id));
  }

  function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      const existing: string[] = JSON.parse(localStorage.getItem("wobble-preview-emails") ?? "[]");
      localStorage.setItem("wobble-preview-emails", JSON.stringify([...new Set([...existing, email.trim()])]));
      setEmailMessage("Saved for this preview. Thanks for wobbling by!");
      setEmail("");
    } catch { setEmailMessage("The browser couldn't save this email. Please try again."); }
  }

  return (
    <>
      {!siteLoaded && <div className={`site-loader ${heroReady ? "is-ready" : ""}`} role="status" aria-label="Loading Wobble Café">
        <span className="loader-wordmark">WOBBLE CAFÉ</span>
        <div className="site-loading-track" aria-hidden="true"><span style={{ width: `${loadingProgress}%` }}/></div>
        <span className="loader-caption">A LITTLE GOODNESS, ON ITS WAY.</span>
      </div>}
    <main inert={!siteLoaded} aria-busy={!siteLoaded}>
      <section className="hero" id="top" onPointerMove={moveTitle} onPointerLeave={resetTitle}>
        <header className="site-header wrap">
          <a className="wordmark" href="#top" aria-label="Wobble Café, back to top">WOBBLE CAFÉ</a>
          <nav className="main-nav" aria-label="Main navigation"><a href="#menu">MENU</a><span aria-hidden="true">/</span><a href="#visit">VISIT</a></nav>
        </header>

        <div className="hero-stage wrap">
          <h1 className="hero-title" ref={titleRef} aria-label="Wobble"><HeroTitle/></h1>
          <span className="crosshair cross-left" aria-hidden="true"/>
          <span className="crosshair cross-right" aria-hidden="true"/>
          <span className="scribble" aria-hidden="true"><svg viewBox="0 0 220 90"><path d="M3 15C75 8 98 59 54 65C28 68 50 38 116 44C162 49 150 90 122 79C100 69 155 51 216 88"/></svg></span>
          <span className="paint paint-main" aria-hidden="true"/><span className="paint paint-left" aria-hidden="true"/><span className="paint paint-right" aria-hidden="true"/>
          <span className="scatter scatter-a"/><span className="scatter scatter-b"/><span className="scatter scatter-c"/>
          <div className="cup-shadow" aria-hidden="true"/>
          <div className="hero-cup" aria-label="Interactive wobbling jelly drink. Drag to move it.">
            <WobbleScene flavor={flavor} wobbleCount={wobbleCount} onReady={() => setHeroReady(true)}/>
          </div>
          <p className="hero-tagline">coffee, snacks &amp;<br/>things that wobble.</p>
          <button className="wobble-prompt" type="button" onClick={() => { setWobbleCount((value) => value + 1); }} aria-label="Make the cup wobble"><span>MOVE TO<br/>WOBBLE</span><span className="prompt-arrow">↗</span></button>
          <svg className="cup-wiggles" viewBox="0 0 460 340" fill="none" aria-hidden="true"><path d="M22 76q-13 27 0 51m10-47q-5 11-1 20M420 48q6 15 1 28m12-35q6 10 2 23M404 257q3 29-14 46m25-30q2 10-4 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
      </section>

      <section className="menu-section wrap" id="menu" aria-label="Featured menu">
        <div className="menu-rail">
          {products.map((product) => <button key={product.id} className={`product-card ${flavor === product.id ? "selected" : ""}`} type="button" onClick={() => chooseProduct(product.id)} aria-pressed={flavor === product.id}>
            <ProductArt kind={product.id}/><span className="product-copy"><strong>{product.name}</strong><span className="product-price">{product.price}</span><span className="product-underline"/></span>
          </button>)}
          <a href="#visit" className="visit-rail-link">COME WOBBLE<br/>WITH US <span>↗</span></a>
          <div className="rail-details"><p><svg className="detail-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7m0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg><span>BROOKLYN<br/>NEW YORK</span></p><p><svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 5v7l5 2"/></svg><span>MON—SUN<br/>08—22 ET</span></p></div>
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-inner wrap">
          <div className="story-intro"><p>We make room for a little play in your day. Come for the coffee, stay for the wobble.</p></div>
          <div className="story-heading"><span className="eyebrow">01 / THE GOOD STUFF</span><h2>GOOD THINGS<br/><em>TAKE TIME</em> TO<br/>JIGGLE<span className="story-dot">.</span></h2></div>
          <aside className="story-note">
            <span className="eyebrow">A FEW GOOD INGREDIENTS</span>
            <svg className="story-cup-doodle" viewBox="0 0 180 130" fill="none" aria-hidden="true"><path d="M43 39Q90 23 132 39L120 106Q92 121 58 105Z" fill="#d8dfb7" stroke="currentColor" strokeWidth="2"/><ellipse cx="87" cy="39" rx="45" ry="12" fill="#f8e6b3" stroke="currentColor" strokeWidth="2"/><path d="M133 48q37-5 23 25-9 15-28 10M65 14q-10-9 2-17M86 17q15-10 3-24M108 15q-8-8 3-16M39 116q54 18 104-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="64" y="59" width="24" height="24" rx="6" fill="#ef9c80" transform="rotate(-13 76 71)"/><rect x="88" y="79" width="23" height="21" rx="5" fill="#d7ae48" transform="rotate(15 99 89)"/></svg>
            <h3>A little care.<br/>A lot of character.</h3>
            <div className="story-note-line"><span>01</span><p><strong>Slow coffee.</strong> A proper brew, never a rush.</p></div>
            <div className="story-note-line"><span>02</span><p><strong>Happy little textures.</strong> Soft clouds, bright jelly, one good sip.</p></div>
            <a className="text-link" href="#menu">FIND YOUR FAVORITE <span>↗</span></a>
          </aside>
          <div className="story-lower"><p>Slow brewed. Hand made.<br/>Happily imperfect.</p><a href="#playground" className="text-link">LET IT LOOSE <span>↘</span></a></div>
        </div>
      </section>

      <section className="playground-section wrap" id="playground">
        <div className="playground-copy"><span className="eyebrow">02 / A LITTLE PLAY</span><h2>JELLY IS<br/>MEANT TO<br/><em>MOVE.</em></h2><p>Go on, drop one. They always land on the happy side.</p><button type="button" className="dark-button" onClick={dropJelly} disabled={plateFull}>{plateFull ? "PLATE IS FULL" : "DROP A JELLY"} <span>{plateFull ? "✦" : "↗"}</span></button><p className="playground-hint" role="status">{plateFull ? "Tap a jelly to pop it away and make room." : "Tap any jelly to pop it away."}</p></div>
        <div className="jelly-playground" aria-label="Interactive 3D jelly playground. Tap a jelly to pop it away, or drag it off the plate."><div className="playground-sun"/><span className="playground-squiggle">〰</span><span className="play-shape play-ring"/><span className="play-shape play-peach"/><span className="play-shape play-checker"/><svg className="play-shape play-loop" viewBox="0 0 150 90" fill="none" aria-hidden="true"><path d="M5 67C12 10 93 2 109 27S44 92 40 51 132 9 145 47" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><span className="playground-note">little things,<br/>big bounce.</span><div className="playground-canvas"><PlaygroundScene jellies={jellies} onRemove={removeJelly}/></div><p>TAP TO POP / DRAG OFF THE PLATE</p></div>
      </section>

      <section className="visit-section" id="visit"><div className="visit-inner wrap"><div><span className="eyebrow">03 / FIND US</span><h2>COME ON IN.<br/><em>STAY AWHILE.</em></h2></div><div className="visit-card"><span className="visit-card-label">YOUR SEAT IS WAITING</span><p>Brooklyn, New York</p><p>Every day · 8 AM—10 PM ET</p><a href="https://www.google.com/maps/search/?api=1&query=cafes+in+Brooklyn+New+York" target="_blank" rel="noopener noreferrer">EXPLORE THE NEIGHBORHOOD <span>↗</span></a></div></div></section>

      <footer className="site-footer"><div className="wrap"><div className="footer-top"><div><span className="eyebrow">A LITTLE NOTE FROM US</span><h2>GOOD MAIL.<br/><em>NO SPILLS.</em></h2></div><form onSubmit={handleEmail}><label htmlFor="newsletter-email">The occasional good thing in your inbox.</label><div className="email-field"><input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="YOUR EMAIL ADDRESS" required/><button type="submit" aria-label="Save email for preview">↗</button></div><p className="form-message" role="status">{emailMessage || "Preview signups are saved in this browser only."}</p></form></div><div className="footer-bottom"><a href="#top" className="footer-brand">WOBBLE CAFÉ</a><span>COFFEE, SNACKS &amp; THINGS THAT WOBBLE.</span><a href="#top">BACK TO TOP ↑</a></div></div></footer>
    </main>
    </>
  );
}
