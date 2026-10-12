"use client";

import { useEffect, useRef, useState } from "react";

export function useSceneVisibility() {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return { container, visible };
}
