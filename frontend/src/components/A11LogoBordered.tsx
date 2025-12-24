interface A11LogoBorderedProps {
  size?: number;
  className?: string;
}

const A11LogoBordered: React.FC<A11LogoBorderedProps> = ({ size = 80, className = '' }) => {
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl blur-xl"></div>
      
      {/* Main logo container */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        style={{ width: '100%', height: '100%' }}
      >
        
        {/* Border with gradient */}
        <rect
          x="10"
          y="10"
          width="180"
          height="180"
          rx="30"
          stroke="url(#borderGradient)"
          strokeWidth="4"
          fill="none"
        />
        
        {/* a11 text */}
        <text
          x="100"
          y="130"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="72"
          fontWeight="700"
          fill="white"
          textAnchor="middle"
          letterSpacing="-2"
        >
          a11
        </text>
        
        {/* Gradient definitions */}
        <defs>
          
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default A11LogoBordered;