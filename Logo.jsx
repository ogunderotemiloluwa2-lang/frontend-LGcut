// LG CUT — Brand logo
// A custom emblem: an interlocked "LG" monogram inside a gold badge,
// paired with a refined wordmark. `tone` controls the colour scheme:
//   tone="light" → for dark backgrounds (off-white ink)
//   tone="dark"  → for light backgrounds (black ink)

const GOLD = "#c7a46a";

export function LogoMark({ size = 40, tone = "light" }) {
  const ink = tone === "light" ? "#f4f1ea" : "#0b0b0b";
  const badgeFill =
    tone === "light" ? "rgba(199, 164, 106, 0.10)" : "rgba(11, 11, 11, 0.04)";

  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="LG CUT emblem"
    >
      {/* Outer badge */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="17"
        fill={badgeFill}
        stroke={GOLD}
        strokeWidth="1.25"
      />
      {/* Inner hairline frame */}
      <rect
        x="6.75"
        y="6.75"
        width="50.5"
        height="50.5"
        rx="12.5"
        stroke={ink}
        strokeOpacity="0.16"
        strokeWidth="0.75"
      />

      {/* "L" — ink */}
      <path
        d="M15 20 V44 H26"
        stroke={ink}
        strokeWidth="3.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* "G" — gold, interlocking with the L */}
      <path
        d="M52 25 A11.5 11.5 0 1 0 52 39 L52 33 L44 33"
        stroke={GOLD}
        strokeWidth="3.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Razor-blade accent */}
      <path
        d="M23 50 H41"
        stroke={GOLD}
        strokeWidth="1.1"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ tone = "light", size = 40, tagline = true }) {
  return (
    <span className={`logo logo--${tone}`}>
      <LogoMark size={size} tone={tone} />
      <span className="logo__text">
        <span className="logo__word">LG CUT</span>
        {tagline && <span className="logo__tag">Premium Barbering</span>}
      </span>
    </span>
  );
}

export default Logo;
