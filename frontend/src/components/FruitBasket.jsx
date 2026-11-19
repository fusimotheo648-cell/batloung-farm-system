// Flat illustration of a fruit basket, used on the dashboard and login poster.
const FruitBasket = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 400 390"
    role="img"
    aria-label="A wicker basket full of fresh fruit"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="bf-weave" width="22" height="16" patternUnits="userSpaceOnUse">
        <rect width="22" height="16" fill="#c98a3d" />
        <path d="M0 8h22" stroke="#a96d26" strokeWidth="2" />
        <path d="M0 0l11 8-11 8M22 0l-11 8 11 8" stroke="#e0a95a" strokeWidth="1.6" fill="none" />
      </pattern>
      <clipPath id="bf-basket">
        <path d="M52 262 C60 330 100 372 150 376 L250 376 C300 372 340 330 348 262 Z" />
      </clipPath>
    </defs>

    {/* handle */}
    <path d="M78 270 C60 40 340 40 322 270" fill="none" stroke="#a96d26" strokeWidth="13" strokeLinecap="round" />
    <path d="M78 270 C60 40 340 40 322 270" fill="none" stroke="#d29a4c" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 12" />

    {/* pineapple */}
    <g>
      <path d="M200 132 C176 96 168 74 176 52 C186 78 196 92 200 104 C204 92 214 78 224 52 C232 74 224 96 200 132Z" fill="#2f8f3e" />
      <path d="M200 120 C190 88 196 58 200 34 C204 58 210 88 200 120Z" fill="#1f7a31" />
      <path d="M200 124 C168 92 150 84 140 66 C162 74 184 92 200 124Z" fill="#3aa04a" />
      <path d="M200 124 C232 92 250 84 260 66 C238 74 216 92 200 124Z" fill="#3aa04a" />
      <ellipse cx="200" cy="200" rx="46" ry="68" fill="#e9a825" />
      <g stroke="#b9770e" strokeWidth="2.2" fill="none" clipPath="url(#bf-pine)">
        <path d="M158 160l84 80M158 190l84 80M158 130l84 80M242 160l-84 80M242 190l-84 80M242 130l-84 80" />
      </g>
      <clipPath id="bf-pine"><ellipse cx="200" cy="200" rx="46" ry="68" /></clipPath>
      <ellipse cx="184" cy="170" rx="7" ry="22" fill="#fff" opacity=".18" />
    </g>

    {/* grapes */}
    <g>
      {[
        [262, 112], [284, 108], [306, 118], [272, 134], [296, 138], [284, 160], [310, 144], [262, 150], [276, 178],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="17" fill="#8fc84a" />
          <circle cx={x - 5} cy={y - 5} r="4.5" fill="#fff" opacity=".35" />
        </g>
      ))}
      <path d="M284 94 C284 84 292 76 300 74" stroke="#5a6b2a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>

    {/* plum */}
    <circle cx="96" cy="170" r="27" fill="#5a2d6e" />
    <ellipse cx="88" cy="160" rx="7" ry="4" fill="#fff" opacity=".25" />

    {/* left red apple */}
    <g>
      <path d="M118 200 C84 188 62 216 70 248 C78 278 118 290 140 276 C162 262 160 214 118 200Z" fill="#c8283a" />
      <path d="M116 202 C112 190 114 182 120 176" stroke="#5a3a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M120 184 C132 172 146 174 150 180 C142 190 128 190 120 184Z" fill="#2f8f3e" />
      <ellipse cx="92" cy="226" rx="6" ry="14" fill="#fff" opacity=".22" transform="rotate(-18 92 226)" />
    </g>

    {/* green apple */}
    <g>
      <circle cx="318" cy="206" r="32" fill="#b8d65a" />
      <path d="M318 176 C316 168 318 162 324 158" stroke="#5a3a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="306" cy="196" rx="6" ry="11" fill="#fff" opacity=".3" />
    </g>

    {/* orange */}
    <g>
      <circle cx="268" cy="240" r="32" fill="#f08a1c" />
      <circle cx="268" cy="212" r="3.5" fill="#2f8f3e" />
      <ellipse cx="256" cy="230" rx="6" ry="10" fill="#fff" opacity=".28" />
    </g>

    {/* front dark apple */}
    <g>
      <path d="M200 226 C164 214 140 242 148 276 C158 308 204 316 226 296 C250 274 244 238 200 226Z" fill="#a31a2e" />
      <path d="M200 228 C198 214 202 206 208 200" stroke="#5a3a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M206 208 C218 196 232 198 236 204 C228 214 214 214 206 208Z" fill="#2f8f3e" />
      <ellipse cx="170" cy="258" rx="6" ry="15" fill="#fff" opacity=".2" transform="rotate(-14 170 258)" />
    </g>

    {/* small yellow flowers */}
    {[[84, 250], [150, 262], [330, 262]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-9" rx="5.5" ry="9" fill="#f2c230" transform={`rotate(${a})`} />
        ))}
        <circle r="5" fill="#b9770e" />
      </g>
    ))}

    {/* basket */}
    <path d="M52 262 C60 330 100 372 150 376 L250 376 C300 372 340 330 348 262 Z" fill="url(#bf-weave)" />
    <path d="M40 252 H360 a10 10 0 0 1 0 20 H40 a10 10 0 0 1 0 -20Z" fill="#b87a30" />
    <path d="M44 258 H356" stroke="#e0a95a" strokeWidth="3" strokeLinecap="round" />
    <g clipPath="url(#bf-basket)">
      <path d="M52 262 C60 330 100 372 150 376 L250 376 C300 372 340 330 348 262" fill="none" stroke="#8a5a1e" strokeWidth="6" opacity=".35" />
    </g>

    {/* ribbon bow */}
    <g>
      <path d="M200 292 C168 262 140 280 150 304 C160 326 190 312 200 292Z" fill="#f2c230" />
      <path d="M200 292 C232 262 260 280 250 304 C240 326 210 312 200 292Z" fill="#f2c230" />
      <path d="M200 296 L176 346 L196 338 L204 352 L214 308Z" fill="#e0a812" />
      <path d="M200 296 L228 344 L208 338 L202 352 L192 308Z" fill="#f2c230" />
      <ellipse cx="200" cy="296" rx="13" ry="12" fill="#e0a812" />
      <path d="M160 294 C170 284 182 286 190 294" stroke="#fff" strokeWidth="3" opacity=".4" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

export default FruitBasket;
