export default function Logo({ size = 36, showText = true, light = false }) {
    const gold = '#E8B84B';
    const navy = light ? '#F4F1E8' : '#16213E';
    const navyBg = light ? '#F4F1E8' : '#16213E';
  
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer coin ring */}
          <circle cx="32" cy="32" r="30" fill={gold} />
          <circle cx="32" cy="32" r="26" fill={navyBg} />
          <circle cx="32" cy="32" r="23" fill={gold} opacity="0.15" />
          
          {/* Inner coin detail ring */}
          <circle cx="32" cy="32" r="20" stroke={gold} strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          
          {/* The "C" letter — stylized */}
          <path 
            d="M38 22C36.2 20.5 34 19.5 31.5 19.5C26 19.5 21.5 24 21.5 29.5V34.5C21.5 40 26 44.5 31.5 44.5C34 44.5 36.2 43.5 38 42" 
            stroke={gold} 
            strokeWidth="4" 
            strokeLinecap="round" 
            fill="none"
          />
          
          {/* Small sparkle/star accent */}
          <g transform="translate(44, 14)">
            <line x1="0" y1="-5" x2="0" y2="5" stroke={gold} strokeWidth="2" strokeLinecap="round" />
            <line x1="-5" y1="0" x2="5" y2="0" stroke={gold} strokeWidth="2" strokeLinecap="round" />
            <line x1="-3" y1="-3" x2="3" y2="3" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="-3" x2="-3" y2="3" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
          </g>
          
          {/* Tiny dot accents */}
          <circle cx="14" cy="18" r="1.5" fill={gold} opacity="0.6" />
          <circle cx="48" cy="46" r="1" fill={gold} opacity="0.4" />
        </svg>
  
        {showText && (
          <span style={{
            fontFamily: 'var(--font-head)',
            fontWeight: 700,
            fontSize: size * 0.55,
            color: light ? navy : 'var(--ink)',
            letterSpacing: '-0.02em'
          }}>
            Campus<span style={{ color: gold }}>Coin</span>
          </span>
        )}
      </div>
    );
  }