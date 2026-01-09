import React from 'react';
import { Plane, Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-14 glass-panel flex items-center justify-between px-6 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Plane className="w-6 h-6 text-primary" />
          <Zap className="w-3 h-3 text-warning absolute -top-1 -right-1" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            AeroWing
          </h1>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Virtual Wind Tunnel
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">REAL-TIME</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-mono">v1.0</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
