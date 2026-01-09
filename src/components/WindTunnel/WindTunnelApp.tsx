import React, { useState, useCallback } from 'react';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import SimulationCanvas from './SimulationCanvas';
import RightSidebar from './RightSidebar';

const WindTunnelApp: React.FC = () => {
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [windSpeed, setWindSpeed] = useState(50);
  const [particleCount, setParticleCount] = useState(60);
  const [lift, setLift] = useState(0);
  const [drag, setDrag] = useState(0);

  const handleMetricsUpdate = useCallback((newLift: number, newDrag: number) => {
    setLift((prev) => prev * 0.9 + newLift * 0.1);
    setDrag((prev) => prev * 0.9 + newDrag * 0.1);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="border-r border-border/50 bg-card/50">
          <LeftSidebar
            tool={tool}
            setTool={setTool}
            windSpeed={windSpeed}
            setWindSpeed={setWindSpeed}
            particleCount={particleCount}
            setParticleCount={setParticleCount}
          />
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 relative">
          <SimulationCanvas
            windSpeed={windSpeed}
            particleCount={particleCount}
            tool={tool}
            onMetricsUpdate={handleMetricsUpdate}
          />
        </main>

        {/* Right Sidebar */}
        <aside className="border-l border-border/50 bg-card/50">
          <RightSidebar lift={lift} drag={drag} />
        </aside>
      </div>
    </div>
  );
};

export default WindTunnelApp;
