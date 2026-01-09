import React, { useRef, useEffect, useCallback, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  life: number;
}

interface SimulationCanvasProps {
  windSpeed: number;
  particleCount: number;
  tool: 'pen' | 'eraser';
  onMetricsUpdate: (lift: number, drag: number) => void;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  windSpeed,
  particleCount,
  tool,
  onMetricsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const obstacleCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Resize handler
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize obstacle canvas with airfoil
  const drawAirfoil = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width * 0.4;
    const centerY = height * 0.5;
    const scale = Math.min(width, height) * 0.25;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    
    // NACA-style airfoil shape
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = t;
      // Upper surface
      const yUpper = 0.6 * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
      if (i === 0) {
        ctx.moveTo(centerX + (x - 0.5) * scale, centerY - yUpper * scale);
      } else {
        ctx.lineTo(centerX + (x - 0.5) * scale, centerY - yUpper * scale);
      }
    }
    
    // Lower surface (reverse)
    for (let i = 100; i >= 0; i--) {
      const t = i / 100;
      const x = t;
      const yLower = 0.6 * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
      ctx.lineTo(centerX + (x - 0.5) * scale, centerY + yLower * scale * 0.3);
    }
    
    ctx.closePath();
    ctx.fill();
  }, []);

  // Initialize obstacle canvas with airfoil on mount and resize
  const initCanvasRef = useRef(false);

  useEffect(() => {
    const obstacleCanvas = obstacleCanvasRef.current;
    if (!obstacleCanvas || dimensions.width === 0) return;

    obstacleCanvas.width = dimensions.width;
    obstacleCanvas.height = dimensions.height;
    
    const ctx = obstacleCanvas.getContext('2d');
    if (ctx) {
      // Only draw airfoil on first init or dimension change
      if (!initCanvasRef.current || dimensions.width > 100) {
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        drawAirfoil(ctx, dimensions.width, dimensions.height);
        initCanvasRef.current = true;
      }
    }
  }, [dimensions, drawAirfoil]);

  // Check if pixel is an obstacle
  const isObstacle = useCallback((x: number, y: number): boolean => {
    const obstacleCanvas = obstacleCanvasRef.current;
    if (!obstacleCanvas) return false;
    
    const ctx = obstacleCanvas.getContext('2d');
    if (!ctx) return false;
    
    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    return pixel[3] > 128; // Check alpha channel
  }, []);

  // Get deflection direction - ensure particles deflect tangentially, not vertically
  const getDeflection = useCallback((x: number, y: number, vx: number, vy: number): { dvx: number; dvy: number } => {
    const sampleRadius = 8;
    let upFree = 0, downFree = 0;
    
    // Sample more points to determine best deflection direction
    for (let i = 1; i <= sampleRadius; i++) {
      if (!isObstacle(x, y - i)) upFree++;
      if (!isObstacle(x, y + i)) downFree++;
    }
    
    const deflectUp = upFree > downFree;
    // Use horizontal velocity to determine deflection strength - maintains forward momentum
    const deflectStrength = Math.max(0.8, vx * 0.4);
    
    return {
      dvx: -vx * 0.2, // Reduce horizontal slowdown
      // Deflect based on direction but keep it proportional and horizontal-biased
      dvy: deflectUp ? -deflectStrength : deflectStrength
    };
  }, [isObstacle]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseSpeed = (windSpeed / 100) * 4 + 1;
    const targetParticles = Math.floor((particleCount / 100) * 400) + 50;

    let totalDrag = 0;
    let totalLift = 0;
    let collisionCount = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Spawn particles
      while (particlesRef.current.length < targetParticles) {
        particlesRef.current.push({
          x: 0,
          y: Math.random() * dimensions.height,
          vx: baseSpeed + Math.random() * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          trail: [],
          life: 1,
        });
      }

      totalDrag = 0;
      totalLift = 0;
      collisionCount = 0;

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        // Update trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();

        // Check collision
        if (isObstacle(p.x, p.y)) {
          const deflection = getDeflection(p.x, p.y, p.vx, p.vy);
          p.vx = Math.max(0.5, p.vx + deflection.dvx);
          p.vy += deflection.dvy;
          collisionCount++;
          totalDrag += Math.abs(p.vx);
          totalLift += p.vy;
          
          // Move particle out of obstacle
          p.x -= p.vx * 0.5;
          p.y += deflection.dvy * 2;
        }

        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;
        
        // Gradually return to base flow
        p.vx = p.vx * 0.99 + baseSpeed * 0.01;
        p.vy *= 0.98;

        // Draw trail with glow
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.lineTo(p.x, p.y);
          
          const gradient = ctx.createLinearGradient(
            p.trail[0].x, p.trail[0].y, p.x, p.y
          );
          gradient.addColorStop(0, 'rgba(0, 240, 255, 0)');
          gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 240, 255, 0.8)');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw particle head with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        return p.x < dimensions.width + 10 && p.y > -10 && p.y < dimensions.height + 10;
      });

      // Update metrics
      const normalizedDrag = Math.min(100, (collisionCount / targetParticles) * 500);
      const normalizedLift = Math.min(100, Math.max(-100, (totalLift / Math.max(1, collisionCount)) * 50));
      onMetricsUpdate(normalizedLift, normalizedDrag);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, windSpeed, particleCount, isObstacle, getDeflection, onMetricsUpdate]);

  // Drawing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    lastPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    
    const obstacleCanvas = obstacleCanvasRef.current;
    if (!obstacleCanvas) return;
    
    const ctx = obstacleCanvas.getContext('2d');
    if (!ctx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.lineWidth = tool === 'eraser' ? 30 : 15;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : '#ffffff';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    lastPosRef.current = { x, y };
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  // Expose methods for external control
  useEffect(() => {
    const canvas = obstacleCanvasRef.current;
    if (!canvas) return;
    
    (window as any).windTunnelCanvas = {
      clear: () => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      },
      drawAirfoil: () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
          drawAirfoil(ctx, dimensions.width, dimensions.height);
        }
      },
      drawCircle: () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(dimensions.width * 0.4, dimensions.height * 0.5, 60, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      drawSquare: () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(dimensions.width * 0.35, dimensions.height * 0.4, 100, 100);
        }
      },
      drawSpoiler: () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(dimensions.width * 0.35, dimensions.height * 0.55);
          ctx.lineTo(dimensions.width * 0.5, dimensions.height * 0.35);
          ctx.lineTo(dimensions.width * 0.52, dimensions.height * 0.55);
          ctx.closePath();
          ctx.fill();
        }
      },
    };
  }, [dimensions, drawAirfoil]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-background">
      {/* Obstacle canvas (visible shape) */}
      <canvas
        ref={obstacleCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: 'screen', opacity: 1 }}
      />
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
};

export default SimulationCanvas;
