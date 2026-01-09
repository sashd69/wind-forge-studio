import React from 'react';
import { Pencil, Eraser, Trash2, Wind, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LeftSidebarProps {
  tool: 'pen' | 'eraser';
  setTool: (tool: 'pen' | 'eraser') => void;
  windSpeed: number;
  setWindSpeed: (speed: number) => void;
  particleCount: number;
  setParticleCount: (count: number) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  tool,
  setTool,
  windSpeed,
  setWindSpeed,
  particleCount,
  setParticleCount,
}) => {
  const handlePreset = (preset: 'airfoil' | 'circle' | 'square' | 'spoiler') => {
    const canvas = (window as any).windTunnelCanvas;
    if (!canvas) return;
    
    switch (preset) {
      case 'airfoil': canvas.drawAirfoil(); break;
      case 'circle': canvas.drawCircle(); break;
      case 'square': canvas.drawSquare(); break;
      case 'spoiler': canvas.drawSpoiler(); break;
    }
  };

  const handleClear = () => {
    const canvas = (window as any).windTunnelCanvas;
    if (canvas) canvas.clear();
  };

  return (
    <div className="w-[250px] h-full flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Wind className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Controls</h2>
      </div>

      {/* Drawing Tools */}
      <div className="sidebar-section">
        <span className="control-label">Drawing Tools</span>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'pen' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setTool('pen')}
                className={tool === 'pen' ? 'glow-cyan' : ''}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pen Tool - Draw obstacles</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setTool('eraser')}
                className={tool === 'eraser' ? 'glow-cyan' : ''}
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eraser - Remove obstacles</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                className="text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear All - Remove all obstacles</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Shape Presets */}
      <div className="sidebar-section">
        <span className="control-label">Shape Presets</span>
        <div className="grid grid-cols-2 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset('airfoil')}
                className="text-xs"
              >
                Airfoil
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Classic NACA airfoil shape for optimal lift</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset('circle')}
                className="text-xs"
              >
                Circle
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>High drag, symmetric flow pattern</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset('square')}
                className="text-xs"
              >
                Square
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Maximum drag, turbulent wake</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset('spoiler')}
                className="text-xs"
              >
                Spoiler
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Downforce-generating wing shape</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Environment Controls */}
      <div className="sidebar-section">
        <span className="control-label">Environment</span>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Wind className="w-3 h-3" />
                Wind Speed
              </span>
              <span className="font-mono text-xs text-primary">{windSpeed}%</span>
            </div>
            <Slider
              value={[windSpeed]}
              onValueChange={([v]) => setWindSpeed(v)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Particle Density
              </span>
              <span className="font-mono text-xs text-primary">{particleCount}%</span>
            </div>
            <Slider
              value={[particleCount]}
              onValueChange={([v]) => setParticleCount(v)}
              min={10}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Help Info */}
      <div className="sidebar-section mt-auto">
        <span className="control-label">Quick Guide</span>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Click & drag to draw shapes</li>
          <li>• Watch particles flow around objects</li>
          <li>• Use presets for common shapes</li>
          <li>• Adjust speed to see flow changes</li>
        </ul>
      </div>
    </div>
  );
};

export default LeftSidebar;
