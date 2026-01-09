import React, { useEffect, useState } from 'react';
import { Activity, ArrowUp, ArrowRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface RightSidebarProps {
  lift: number;
  drag: number;
}

interface DataPoint {
  time: number;
  lift: number;
  drag: number;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ lift, drag }) => {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [efficiency, setEfficiency] = useState(0);

  useEffect(() => {
    const now = Date.now();
    setHistory((prev) => {
      const updated = [...prev, { time: now, lift: Math.abs(lift), drag }].slice(-30);
      return updated;
    });

    // Calculate efficiency (lift/drag ratio) - lower drag = better efficiency
    // Efficiency decreases as drag increases, increases with positive lift
    const dragPenalty = Math.min(drag, 100);
    const liftBonus = Math.max(0, Math.abs(lift)) * 0.5;
    const eff = Math.max(0, 100 - dragPenalty + liftBonus);
    setEfficiency(Math.min(100, Math.max(0, eff)));
  }, [lift, drag]);

  const getLiftStatus = () => {
    if (lift > 20) return { label: 'HIGH', color: 'text-success' };
    if (lift > 0) return { label: 'POSITIVE', color: 'text-primary' };
    if (lift < -20) return { label: 'NEGATIVE', color: 'text-warning' };
    return { label: 'NEUTRAL', color: 'text-muted-foreground' };
  };

  const getDragStatus = () => {
    if (drag > 60) return { label: 'CRITICAL', color: 'text-destructive' };
    if (drag > 30) return { label: 'HIGH', color: 'text-warning' };
    return { label: 'OPTIMAL', color: 'text-success' };
  };

  const liftStatus = getLiftStatus();
  const dragStatus = getDragStatus();

  return (
    <div className="w-[300px] h-full flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-5 h-5 text-primary animate-pulse-glow" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Telemetry</h2>
        <span className="ml-auto text-[10px] font-mono text-success uppercase">● Live</span>
      </div>

      {/* Lift Metric */}
      <div className="metric-card">
        <div className="flex items-start justify-between">
          <div>
            <span className="control-label flex items-center gap-1.5">
              <ArrowUp className="w-3 h-3" />
              Simulated Lift
            </span>
            <div className="data-value text-primary text-glow-cyan mt-1">
              {lift.toFixed(1)}
            </div>
            <span className={`text-xs font-mono ${liftStatus.color}`}>
              {liftStatus.label}
            </span>
          </div>
          <div className="w-20 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <YAxis domain={[-50, 50]} hide />
                <Line
                  type="monotone"
                  dataKey="lift"
                  stroke="hsl(186, 100%, 50%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Drag Metric */}
      <div className="metric-card">
        <div className="flex items-start justify-between">
          <div>
            <span className="control-label flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3" />
              Simulated Drag
            </span>
            <div className={`data-value mt-1 ${drag > 60 ? 'text-destructive' : drag > 30 ? 'text-warning text-glow-amber' : 'text-success'}`}>
              {drag.toFixed(1)}
            </div>
            <span className={`text-xs font-mono ${dragStatus.color}`}>
              {dragStatus.label}
            </span>
          </div>
          <div className="w-20 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <YAxis domain={[0, 100]} hide />
                <Line
                  type="monotone"
                  dataKey="drag"
                  stroke="hsl(43, 100%, 50%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Efficiency */}
      <div className="metric-card">
        <div className="space-y-2">
          <span className="control-label flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Aerodynamic Efficiency
          </span>
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
              style={{
                width: `${efficiency}%`,
                background: efficiency > 70
                  ? 'linear-gradient(90deg, hsl(160, 84%, 39%), hsl(160, 84%, 50%))'
                  : efficiency > 40
                  ? 'linear-gradient(90deg, hsl(43, 100%, 40%), hsl(43, 100%, 50%))'
                  : 'linear-gradient(90deg, hsl(0, 84%, 50%), hsl(0, 84%, 60%))',
              }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">L/D Ratio</span>
            <span className={efficiency > 70 ? 'text-success' : efficiency > 40 ? 'text-warning' : 'text-destructive'}>
              {efficiency.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Flow Analysis */}
      <div className="sidebar-section mt-2">
        <span className="control-label">Flow Analysis</span>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="font-mono text-lg text-primary">{history.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Samples</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="font-mono text-lg text-primary">
              {history.length > 1 
                ? (Math.abs(history[history.length - 1]?.drag - history[history.length - 2]?.drag) || 0).toFixed(1)
                : '0.0'
              }
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">Δ Drag</div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="sidebar-section mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Simulation Status</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-mono text-success">RUNNING</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
