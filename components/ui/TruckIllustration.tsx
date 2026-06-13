'use client'

export function TruckIllustration({ className }: { className?: string }) {
  return (
    <div className={`relative w-full select-none ${className ?? ''}`} aria-hidden="true">
      <style>{`
        @keyframes gp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes gp-dash {
          0%   { opacity: 0;   transform: translateX(16px); }
          40%  { opacity: 0.8; }
          100% { opacity: 0;   transform: translateX(-36px); }
        }
        @keyframes gp-exhaust {
          0%, 100% { opacity: 0; transform: translateY(0) scaleX(1); }
          50%      { opacity: 0.5; transform: translateY(-8px) scaleX(1.3); }
        }
        .gp-truck-group { animation: gp-float 2.6s ease-in-out infinite; }
        .gp-wheel {
          transform-box: fill-box;
          transform-origin: center;
          animation: gp-spin 1.3s linear infinite;
        }
        .gp-d1 { animation: gp-dash 1.7s ease-in-out infinite 0s; }
        .gp-d2 { animation: gp-dash 1.7s ease-in-out infinite 0.38s; }
        .gp-d3 { animation: gp-dash 1.7s ease-in-out infinite 0.76s; }
        .gp-exhaust { animation: gp-exhaust 1.4s ease-in-out infinite; }
      `}</style>

      <svg
        viewBox="0 0 720 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Ground shadow */}
        <ellipse cx="370" cy="278" rx="300" ry="11" fill="rgba(0,0,0,0.08)" />

        {/* Motion dashes */}
        <rect className="gp-d1" x="6"  y="191" width="58" height="5" rx="2.5" fill="#0EA5E9" />
        <rect className="gp-d2" x="12" y="208" width="40" height="4" rx="2"   fill="#0EA5E9" opacity="0.55" />
        <rect className="gp-d3" x="2"  y="222" width="50" height="4" rx="2"   fill="#0EA5E9" opacity="0.35" />

        {/* ────────── TRUCK GROUP (bounce) ────────── */}
        <g className="gp-truck-group">

          {/* Exhaust smoke puffs */}
          <ellipse className="gp-exhaust" cx="486" cy="84"  rx="7"  ry="5"  fill="#94A3B8" opacity="0.5" />
          <ellipse className="gp-exhaust" cx="492" cy="74"  rx="5"  ry="4"  fill="#94A3B8" opacity="0.35" style={{ animationDelay: '0.3s' }} />
          <ellipse className="gp-exhaust" cx="495" cy="66"  rx="4"  ry="3"  fill="#94A3B8" opacity="0.2"  style={{ animationDelay: '0.6s' }} />

          {/* Exhaust pipe */}
          <rect x="482" y="90" width="9" height="32" rx="4" fill="#334155" />

          {/* ── Cargo body ── */}
          {/* White panel */}
          <rect x="72"  y="84"  width="420" height="165" rx="7" fill="white" stroke="#0369A1" strokeWidth="2.5" />

          {/* Top blue stripe */}
          <rect x="72"  y="84"  width="420" height="22"  rx="7" fill="#0369A1" />
          <rect x="72"  y="98"  width="420" height="8"   fill="#0369A1" />

          {/* Bottom blue stripe */}
          <rect x="72"  y="234" width="420" height="15"  fill="#0369A1" />
          <path d="M72 241 H492 V249 A7 7 0 0 1 485 249 H79 A7 7 0 0 1 72 242 Z" fill="#0369A1" />

          {/* Door seam */}
          <line x1="392" y1="106" x2="392" y2="249" stroke="#0369A1" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.25" />

          {/* ─── GrandPro Logo on cargo side ─── */}
          {/* Hex center (258,148), r=40 — shifted up so text stays in white panel */}
          {/* Points: top(258,108) tr(293,128) br(293,168) bot(258,188) bl(223,168) tl(223,128) */}
          <polygon
            points="258,108 293,128 293,168 258,188 223,168 223,128"
            fill="none"
            stroke="#0369A1"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Top face of cube */}
          <polygon
            points="258,108 293,128 258,148 223,128"
            fill="rgba(3,105,161,0.07)"
            stroke="#0369A1"
            strokeWidth="1.5"
            opacity="0.7"
          />
          {/* Center vertical divider */}
          <line x1="258" y1="148" x2="258" y2="188" stroke="#0369A1" strokeWidth="1.5" opacity="0.25" />

          {/* Green diagonal band */}
          <polygon
            points="223,140 293,158 293,168 223,150"
            fill="#65A30D"
            opacity="0.85"
          />

          {/* Arrow (right-pointing, inside hex) */}
          <polygon
            points="264,132 288,148 264,164 269,148"
            fill="#0369A1"
          />
          {/* Arrow shaft */}
          <rect x="237" y="142" width="30" height="12" rx="3" fill="#0369A1" opacity="0.7" />

          {/* "GrandPro" text */}
          <text
            x="258"
            y="210"
            textAnchor="middle"
            fill="#0369A1"
            fontSize="18"
            fontWeight="800"
            fontFamily="Arial Black, Arial, sans-serif"
          >
            GrandPro
          </text>
          {/* "MOVING ALMATY" */}
          <text
            x="258"
            y="225"
            textAnchor="middle"
            fill="#65A30D"
            fontSize="9.5"
            fontWeight="700"
            fontFamily="Arial, sans-serif"
            letterSpacing="2"
          >
            MOVING ALMATY
          </text>

          {/* ── CAB ── */}
          <path
            d="M492 108 L492 249 L652 249 L652 178 L612 108 Z"
            fill="#0369A1"
          />

          {/* Cab highlight (top edge) */}
          <path
            d="M492 108 L612 108 L652 178 L652 185 L612 115 L492 115 Z"
            fill="#0284C7"
          />

          {/* Cab window */}
          <path
            d="M504 116 L504 182 L646 182 L646 175 L609 116 Z"
            fill="#BAE6FD"
          />
          <path
            d="M504 116 L504 182 L646 182 L646 175 L609 116 Z"
            stroke="#0284C7"
            strokeWidth="1.5"
          />

          {/* Window center divider */}
          <line x1="565" y1="116" x2="548" y2="182" stroke="#0284C7" strokeWidth="2" opacity="0.5" />

          {/* Cab door line */}
          <line x1="538" y1="182" x2="538" y2="247" stroke="#0284C7" strokeWidth="2" opacity="0.5" />

          {/* Door handle */}
          <rect x="520" y="216" width="18" height="5.5" rx="2.75" fill="#38BDF8" />

          {/* GrandPro.kz text on cab door */}
          <text
            x="556"
            y="230"
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontFamily="Arial, sans-serif"
            opacity="0.7"
          >
            grandpro.kz
          </text>

          {/* Front bumper */}
          <rect x="641" y="236" width="20" height="15" rx="4" fill="#0284C7" />
          {/* Bumper guard */}
          <rect x="641" y="243" width="20" height="4" rx="2" fill="#0EA5E9" opacity="0.6" />

          {/* Headlight */}
          <rect x="643" y="214" width="14" height="16" rx="3.5" fill="#FEF9C3" stroke="#EAB308" strokeWidth="1.5" />
          {/* Headlight glow */}
          <ellipse cx="657" cy="222" rx="8" ry="6" fill="#FEF08A" opacity="0.4" />

          {/* Side mirror */}
          <rect x="641" y="155" width="10" height="14" rx="3" fill="#0284C7" />
          <rect x="639" y="152" width="14" height="7"  rx="3" fill="#0284C7" />

          {/* Chassis rail */}
          <rect x="72" y="247" width="590" height="9" rx="3.5" fill="#0284C7" />

          {/* ── WHEELS ── */}
          {/* Rear axle bar */}
          <rect x="158" y="248" width="115" height="7" rx="3.5" fill="#1E293B" />

          {/* Rear wheel 1 */}
          <g className="gp-wheel">
            <circle cx="170" cy="259" r="26" fill="#1E293B" />
            <circle cx="170" cy="259" r="17" fill="#374151" />
            <line x1="170" y1="242" x2="170" y2="276" stroke="#0EA5E9" strokeWidth="3" />
            <line x1="153" y1="259" x2="187" y2="259" stroke="#0EA5E9" strokeWidth="3" />
            <line x1="158" y1="247" x2="182" y2="271" stroke="#0EA5E9" strokeWidth="2.5" opacity="0.65" />
            <line x1="182" y1="247" x2="158" y2="271" stroke="#0EA5E9" strokeWidth="2.5" opacity="0.65" />
            <circle cx="170" cy="259" r="7.5" fill="#0EA5E9" />
          </g>

          {/* Rear wheel 2 */}
          <g className="gp-wheel">
            <circle cx="255" cy="259" r="26" fill="#1E293B" />
            <circle cx="255" cy="259" r="17" fill="#374151" />
            <line x1="255" y1="242" x2="255" y2="276" stroke="#0EA5E9" strokeWidth="3" />
            <line x1="238" y1="259" x2="272" y2="259" stroke="#0EA5E9" strokeWidth="3" />
            <line x1="243" y1="247" x2="267" y2="271" stroke="#0EA5E9" strokeWidth="2.5" opacity="0.65" />
            <line x1="267" y1="247" x2="243" y2="271" stroke="#0EA5E9" strokeWidth="2.5" opacity="0.65" />
            <circle cx="255" cy="259" r="7.5" fill="#0EA5E9" />
          </g>

          {/* Front wheel */}
          <g className="gp-wheel">
            <circle cx="584" cy="259" r="28" fill="#1E293B" />
            <circle cx="584" cy="259" r="18" fill="#374151" />
            <line x1="584" y1="241" x2="584" y2="277" stroke="#0EA5E9" strokeWidth="3" />
            <line x1="566" y1="259" x2="602" y2="259" stroke="#0EA5E9" strokeWidth="3" />
            <line x1="571" y1="246" x2="597" y2="272" stroke="#0EA5E9" strokeWidth="2.5" opacity="0.65" />
            <line x1="597" y1="246" x2="571" y2="272" stroke="#0EA5E9" strokeWidth="2.5" opacity="0.65" />
            <circle cx="584" cy="259" r="8.5" fill="#0EA5E9" />
          </g>

        </g>
      </svg>
    </div>
  )
}
