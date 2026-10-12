export function HeroTitle() {
  return <svg className="painted-title" viewBox="0 0 1500 340" aria-hidden="true">
    <defs>
      <filter id="paint-grain" x="-15%" y="-25%" width="130%" height="150%"><feTurbulence type="fractalNoise" baseFrequency=".08 .28" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="13"/><feComposite in2="n" operator="in"/></filter>
      <filter id="letter-edges" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".014 .025" numOctaves="3" seed="8" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="ink-grain">
        <feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="12"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope=".075"/></feComponentTransfer>
        <feComposite in2="SourceGraphic" operator="in"/>
        <feBlend in2="SourceGraphic" mode="screen"/>
      </filter>
    </defs>
    <g filter="url(#letter-edges)" fill="currentColor" fontFamily="Georgia,serif" fontWeight="900" fontSize="365">
      <g filter="url(#ink-grain)">
        <g className="title-letter"><text x="8" y="280" transform="rotate(-9 170 170) scale(.97 1)">W</text></g>
        <g className="title-letter"><text x="340" y="285" transform="rotate(6 455 170) scale(.98 1)">O</text></g>
        <g className="title-letter"><text x="586" y="284" transform="rotate(-3 700 170)">B</text></g>
        <g className="title-letter"><text x="812" y="272" transform="rotate(5 930 160)">B</text></g>
        <g className="title-letter"><text x="1039" y="300" transform="rotate(12 1120 180)">L</text></g>
        <g className="title-letter"><text x="1266" y="313" transform="rotate(7 1370 190)">E</text></g>
      </g>
    </g>
  </svg>;
}
