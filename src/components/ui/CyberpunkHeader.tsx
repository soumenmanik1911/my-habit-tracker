import React from 'react';

interface CyberpunkHeaderProps {
  title: string;
  level?: number;
}

export const CyberpunkHeader: React.FC<CyberpunkHeaderProps> = ({ title, level }) => {
  return (
    <div className="relative mb-8">
      {/* Grid Floor Perspective Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          transform: 'perspective(500px) rotateX(20deg) translateY(10px)',
          transformOrigin: 'center top',
        }}
      />

      {/* Floating Animation Container */}
      <div className="relative animate-float">
        <div className="flex items-center justify-center gap-4">
          {/* Level Badge */}
          {level && (
            <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-400 text-sm font-bold animate-pulse">
              Lvl {level}
            </div>
          )}

          {/* Title with 3D Effects */}
          <h1
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"
            style={{
              textShadow: `
                0 0 5px rgba(236, 72, 153, 0.5),
                0 0 10px rgba(236, 72, 153, 0.3),
                0 0 15px rgba(236, 72, 153, 0.2),
                0 0 20px rgba(6, 182, 212, 0.5),
                0 0 25px rgba(6, 182, 212, 0.3),
                0 0 30px rgba(6, 182, 212, 0.2),
                2px 2px 4px rgba(0, 0, 0, 0.5)
              `,
              filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.3))',
            }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 rounded-lg blur-xl opacity-50" />

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};