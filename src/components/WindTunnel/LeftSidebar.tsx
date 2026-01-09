import React, { useState } from 'react';
import { Pencil, Eraser, Trash2, Wind, Sparkles, Play, Pause, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, RotateCw, FlipHorizontal, FlipVertical, Car, Bike, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type WindDirection } from './WindTunnelApp';

type ShapePreset = 'airfoil' | 'circle' | 'square' | 'spoiler' | 'car' | 'bike' | 'airplane' | 'f1car';

interface LeftSidebarProps {
  tool: 'pen' | 'eraser';
  setTool: (tool: 'pen' | 'eraser') => void;
  windSpeed: number;
  setWindSpeed: (speed: number) => void;
  particleCount: number;
  setParticleCount: (count: number) => void;
  windDirection: WindDirection;
  setWindDirection: (direction: WindDirection) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  tool,
  setTool,
  windSpeed,
  setWindSpeed,
  particleCount,
  setParticleCount,
  windDirection,
  setWindDirection,
  isRunning,
  setIsRunning,
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [currentShape, setCurrentShape] = useState<ShapePreset | null>(null);

  const applyShape = (preset: ShapePreset, rot: { x: number; y: number; z: number }) => {
    const canvas = (window as any).windTunnelCanvas;
    if (!canvas) return;
    
    switch (preset) {
      case 'airfoil': canvas.drawAirfoil(rot); break;
      case 'circle': canvas.drawCircle(rot); break;
      case 'square': canvas.drawSquare(rot); break;
      case 'spoiler': canvas.drawSpoiler(rot); break;
      case 'car': canvas.drawCar(rot); break;
      case 'bike': canvas.drawBike(rot); break;
      case 'airplane': canvas.drawAirplane(rot); break;
      case 'f1car': canvas.drawF1Car(rot); break;
    }
  };

  const handlePreset = (preset: ShapePreset) => {
    setCurrentShape(preset);
    setRotation({ x: 0, y: 0, z: 0 });
    applyShape(preset, { x: 0, y: 0, z: 0 });
  };

  const handleRotation = (axis: 'x' | 'y' | 'z', delta: number) => {
    if (!currentShape) return;
    const newRotation = { ...rotation };
    if (axis === 'z') {
      newRotation.z = (newRotation.z + delta) % 360;
    } else {
      newRotation[axis] = newRotation[axis] === 0 ? 180 : 0;
    }
    setRotation(newRotation);
    applyShape(currentShape, newRotation);
  };

  const handleClear = () => {
    const canvas = (window as any).windTunnelCanvas;
    if (canvas) canvas.clear();
    setCurrentShape(null);
    setRotation({ x: 0, y: 0, z: 0 });
  };

  const directionOptions: { value: WindDirection; icon: React.ReactNode; label: string }[] = [
    { value: 'left-right', icon: <ArrowRight className="w-4 h-4" />, label: 'Left → Right' },
    { value: 'right-left', icon: <ArrowLeft className="w-4 h-4" />, label: 'Right → Left' },
    { value: 'top-bottom', icon: <ArrowDown className="w-4 h-4" />, label: 'Top → Bottom' },
    { value: 'bottom-top', icon: <ArrowUp className="w-4 h-4" />, label: 'Bottom → Top' },
  ];

  return (
    <div className="w-[250px] h-full flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Wind className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Controls</h2>
      </div>

      {/* Simulation Control */}
      <div className="sidebar-section">
        <span className="control-label">Simulation</span>
        <Button
          variant={isRunning ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsRunning(!isRunning)}
          className={`w-full ${isRunning ? 'glow-cyan' : ''}`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Resume
            </>
          )}
        </Button>
      </div>

      {/* Wind Direction */}
      <div className="sidebar-section">
        <span className="control-label">Wind Direction</span>
        <div className="grid grid-cols-2 gap-2">
          {directionOptions.map((option) => (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={windDirection === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWindDirection(option.value)}
                  className={`text-xs ${windDirection === option.value ? 'glow-cyan' : ''}`}
                >
                  {option.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{option.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
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

      {/* Shape Presets - Basic */}
      <div className="sidebar-section">
        <span className="control-label">Basic Shapes</span>
        <div className="grid grid-cols-2 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentShape === 'airfoil' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('airfoil')}
                className={`text-xs ${currentShape === 'airfoil' ? 'glow-cyan' : ''}`}
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
                variant={currentShape === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('circle')}
                className={`text-xs ${currentShape === 'circle' ? 'glow-cyan' : ''}`}
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
                variant={currentShape === 'square' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('square')}
                className={`text-xs ${currentShape === 'square' ? 'glow-cyan' : ''}`}
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
                variant={currentShape === 'spoiler' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('spoiler')}
                className={`text-xs ${currentShape === 'spoiler' ? 'glow-cyan' : ''}`}
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

      {/* Real World Presets */}
      <div className="sidebar-section">
        <span className="control-label">Real World Shapes</span>
        <div className="grid grid-cols-2 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentShape === 'car' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('car')}
                className={`text-xs ${currentShape === 'car' ? 'glow-cyan' : ''}`}
              >
                <Car className="w-3 h-3 mr-1" />
                Sedan
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Standard sedan car profile</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentShape === 'f1car' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('f1car')}
                className={`text-xs ${currentShape === 'f1car' ? 'glow-cyan' : ''}`}
              >
                <Car className="w-3 h-3 mr-1" />
                F1 Car
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Formula 1 racing car - optimized aerodynamics</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentShape === 'bike' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('bike')}
                className={`text-xs ${currentShape === 'bike' ? 'glow-cyan' : ''}`}
              >
                <Bike className="w-3 h-3 mr-1" />
                Bike
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cyclist on bicycle - study rider position</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentShape === 'airplane' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset('airplane')}
                className={`text-xs ${currentShape === 'airplane' ? 'glow-cyan' : ''}`}
              >
                <Plane className="w-3 h-3 mr-1" />
                Airplane
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Commercial airplane - top-down view</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Rotation Controls */}
      {currentShape && (
        <div className="sidebar-section">
          <span className="control-label">Rotate / Flip Shape</span>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRotation('z', 45)}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rotate 45° (Z-axis)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={rotation.y !== 0 ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleRotation('y', 180)}
                  className={rotation.y !== 0 ? 'glow-cyan' : ''}
                >
                  <FlipHorizontal className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Flip Horizontal (Y-axis)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={rotation.x !== 0 ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleRotation('x', 180)}
                  className={rotation.x !== 0 ? 'glow-cyan' : ''}
                >
                  <FlipVertical className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Flip Vertical (X-axis)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            Z: {rotation.z}° | Flip X: {rotation.x !== 0 ? 'Yes' : 'No'} | Flip Y: {rotation.y !== 0 ? 'Yes' : 'No'}
          </div>
        </div>
      )}

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
