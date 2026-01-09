import React, { useRef, useEffect, useCallback, useState } from 'react';
import { type WindDirection } from './WindTunnelApp';

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
  windDirection: WindDirection;
  isRunning: boolean;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  windSpeed,
  particleCount,
  tool,
  onMetricsUpdate,
  windDirection,
  isRunning,
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

  // Get velocity based on wind direction
  const getDirectionalVelocity = useCallback((baseSpeed: number): { vx: number; vy: number } => {
    switch (windDirection) {
      case 'left-right':
        return { vx: baseSpeed + Math.random() * 0.5, vy: (Math.random() - 0.5) * 0.5 };
      case 'right-left':
        return { vx: -(baseSpeed + Math.random() * 0.5), vy: (Math.random() - 0.5) * 0.5 };
      case 'top-bottom':
        return { vx: (Math.random() - 0.5) * 0.5, vy: baseSpeed + Math.random() * 0.5 };
      case 'bottom-top':
        return { vx: (Math.random() - 0.5) * 0.5, vy: -(baseSpeed + Math.random() * 0.5) };
      default:
        return { vx: baseSpeed + Math.random() * 0.5, vy: (Math.random() - 0.5) * 0.5 };
    }
  }, [windDirection]);

  // Get spawn position based on wind direction
  const getSpawnPosition = useCallback((width: number, height: number): { x: number; y: number } => {
    switch (windDirection) {
      case 'left-right':
        return { x: 0, y: Math.random() * height };
      case 'right-left':
        return { x: width, y: Math.random() * height };
      case 'top-bottom':
        return { x: Math.random() * width, y: 0 };
      case 'bottom-top':
        return { x: Math.random() * width, y: height };
      default:
        return { x: 0, y: Math.random() * height };
    }
  }, [windDirection]);

  // Check if particle is out of bounds
  const isOutOfBounds = useCallback((p: Particle, width: number, height: number): boolean => {
    const margin = 10;
    switch (windDirection) {
      case 'left-right':
        return p.x > width + margin;
      case 'right-left':
        return p.x < -margin;
      case 'top-bottom':
        return p.y > height + margin;
      case 'bottom-top':
        return p.y < -margin;
      default:
        return p.x > width + margin || p.y < -margin || p.y > height + margin;
    }
  }, [windDirection]);

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
      if (!isRunning) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Spawn particles
      while (particlesRef.current.length < targetParticles) {
        const spawnPos = getSpawnPosition(dimensions.width, dimensions.height);
        const velocity = getDirectionalVelocity(baseSpeed);
        particlesRef.current.push({
          x: spawnPos.x,
          y: spawnPos.y,
          vx: velocity.vx,
          vy: velocity.vy,
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

        // Predict next position
        const nextX = p.x + p.vx;
        const nextY = p.y + p.vy;

        // Check collision at multiple points along path for accuracy
        let collided = false;
        for (let t = 0; t <= 1 && !collided; t += 0.25) {
          const checkX = p.x + (nextX - p.x) * t;
          const checkY = p.y + (nextY - p.y) * t;
          if (isObstacle(checkX, checkY)) {
            collided = true;
            const deflection = getDeflection(checkX, checkY, p.vx, p.vy);
            
            // Push particle away from obstacle
            let escapeX = checkX;
            let escapeY = checkY;
            const escapeDir = deflection.dvy < 0 ? -1 : 1;
            
            // Find clear position
            for (let i = 1; i <= 20; i++) {
              if (!isObstacle(escapeX - Math.sign(p.vx) * i, escapeY + escapeDir * i)) {
                escapeX = escapeX - Math.sign(p.vx) * i;
                escapeY = escapeY + escapeDir * i;
                break;
              }
            }
            
            p.x = escapeX;
            p.y = escapeY;
            p.vx = p.vx * 0.7;
            p.vy = deflection.dvy * 0.8;
            
            collisionCount++;
            totalDrag += 1;
            totalLift += deflection.dvy;
          }
        }

        // Apply velocity only if no collision
        if (!collided) {
          p.x += p.vx;
          p.y += p.vy;
        }
        
        // Gradually return to base flow
        const targetVel = getDirectionalVelocity(baseSpeed);
        p.vx = p.vx * 0.99 + targetVel.vx * 0.01;
        p.vy = p.vy * 0.95 + targetVel.vy * 0.05;

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

        return !isOutOfBounds(p, dimensions.width, dimensions.height);
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
  }, [dimensions, windSpeed, particleCount, isObstacle, getDeflection, onMetricsUpdate, windDirection, isRunning, getDirectionalVelocity, getSpawnPosition, isOutOfBounds]);

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
    
    const drawWithTransform = (
      ctx: CanvasRenderingContext2D,
      drawFn: () => void,
      rotation: { x: number; y: number; z: number }
    ) => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.save();
      ctx.translate(dimensions.width * 0.4, dimensions.height * 0.5);
      
      // Z-axis rotation
      ctx.rotate((rotation.z * Math.PI) / 180);
      
      // X-axis flip (vertical flip simulation)
      if (rotation.x !== 0) ctx.scale(1, rotation.x > 0 ? -1 : 1);
      
      // Y-axis flip (horizontal flip simulation)
      if (rotation.y !== 0) ctx.scale(rotation.y > 0 ? -1 : 1, 1);
      
      ctx.translate(-dimensions.width * 0.4, -dimensions.height * 0.5);
      drawFn();
      ctx.restore();
    };

    (window as any).windTunnelCanvas = {
      clear: () => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      },
      drawAirfoil: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => drawAirfoil(ctx, dimensions.width, dimensions.height), rotation);
        }
      },
      drawCircle: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(dimensions.width * 0.4, dimensions.height * 0.5, 60, 0, Math.PI * 2);
            ctx.fill();
          }, rotation);
        }
      },
      drawSquare: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(dimensions.width * 0.35, dimensions.height * 0.4, 100, 100);
          }, rotation);
        }
      },
      drawSpoiler: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(dimensions.width * 0.35, dimensions.height * 0.55);
            ctx.lineTo(dimensions.width * 0.5, dimensions.height * 0.35);
            ctx.lineTo(dimensions.width * 0.52, dimensions.height * 0.55);
            ctx.closePath();
            ctx.fill();
          }, rotation);
        }
      },
      drawCar: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => {
            const cx = dimensions.width * 0.4;
            const cy = dimensions.height * 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            // Car body (sedan profile)
            ctx.moveTo(cx - 80, cy + 20);
            ctx.lineTo(cx - 70, cy + 20);
            ctx.quadraticCurveTo(cx - 65, cy - 5, cx - 40, cy - 15);
            ctx.lineTo(cx - 10, cy - 25);
            ctx.quadraticCurveTo(cx + 10, cy - 30, cx + 30, cy - 25);
            ctx.lineTo(cx + 50, cy - 15);
            ctx.quadraticCurveTo(cx + 70, cy - 5, cx + 80, cy + 20);
            ctx.lineTo(cx + 80, cy + 25);
            ctx.lineTo(cx - 80, cy + 25);
            ctx.closePath();
            ctx.fill();
            // Wheels
            ctx.beginPath();
            ctx.arc(cx - 45, cy + 25, 12, 0, Math.PI * 2);
            ctx.arc(cx + 45, cy + 25, 12, 0, Math.PI * 2);
            ctx.fill();
          }, rotation);
        }
      },
      drawBike: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => {
            const cx = dimensions.width * 0.4;
            const cy = dimensions.height * 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            // Frame
            ctx.beginPath();
            ctx.moveTo(cx - 50, cy + 15);
            ctx.lineTo(cx - 20, cy - 25);
            ctx.lineTo(cx + 20, cy - 25);
            ctx.lineTo(cx + 40, cy + 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 20, cy - 25);
            ctx.lineTo(cx + 10, cy + 15);
            ctx.stroke();
            // Wheels
            ctx.beginPath();
            ctx.arc(cx - 50, cy + 15, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + 40, cy + 15, 20, 0, Math.PI * 2);
            ctx.stroke();
            // Rider silhouette
            ctx.beginPath();
            ctx.arc(cx, cy - 45, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx, cy - 35);
            ctx.lineTo(cx - 5, cy - 10);
            ctx.lineTo(cx + 10, cy + 15);
            ctx.stroke();
          }, rotation);
        }
      },
      drawAirplane: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => {
            const cx = dimensions.width * 0.4;
            const cy = dimensions.height * 0.5;
            ctx.fillStyle = '#ffffff';
            // Fuselage
            ctx.beginPath();
            ctx.ellipse(cx, cy, 80, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Nose cone
            ctx.beginPath();
            ctx.moveTo(cx + 80, cy);
            ctx.quadraticCurveTo(cx + 110, cy, cx + 100, cy);
            ctx.lineTo(cx + 80, cy - 10);
            ctx.lineTo(cx + 80, cy + 10);
            ctx.closePath();
            ctx.fill();
            // Main wings
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 10);
            ctx.lineTo(cx - 60, cy - 50);
            ctx.lineTo(cx - 70, cy - 45);
            ctx.lineTo(cx - 20, cy - 10);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 10);
            ctx.lineTo(cx - 60, cy + 50);
            ctx.lineTo(cx - 70, cy + 45);
            ctx.lineTo(cx - 20, cy + 10);
            ctx.closePath();
            ctx.fill();
            // Tail wings
            ctx.beginPath();
            ctx.moveTo(cx - 70, cy - 10);
            ctx.lineTo(cx - 85, cy - 30);
            ctx.lineTo(cx - 80, cy - 10);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx - 70, cy + 10);
            ctx.lineTo(cx - 85, cy + 30);
            ctx.lineTo(cx - 80, cy + 10);
            ctx.closePath();
            ctx.fill();
            // Vertical stabilizer
            ctx.beginPath();
            ctx.moveTo(cx - 75, cy - 15);
            ctx.lineTo(cx - 80, cy - 40);
            ctx.lineTo(cx - 65, cy - 15);
            ctx.closePath();
            ctx.fill();
          }, rotation);
        }
      },
      drawF1Car: (rotation = { x: 0, y: 0, z: 0 }) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWithTransform(ctx, () => {
            const cx = dimensions.width * 0.4;
            const cy = dimensions.height * 0.5;
            ctx.fillStyle = '#ffffff';
            // Main body
            ctx.beginPath();
            ctx.moveTo(cx - 70, cy + 5);
            ctx.lineTo(cx - 50, cy - 10);
            ctx.lineTo(cx + 40, cy - 10);
            ctx.lineTo(cx + 70, cy);
            ctx.lineTo(cx + 70, cy + 10);
            ctx.lineTo(cx - 70, cy + 10);
            ctx.closePath();
            ctx.fill();
            // Front wing
            ctx.fillRect(cx + 55, cy - 20, 20, 8);
            ctx.fillRect(cx + 55, cy + 12, 20, 8);
            // Rear wing
            ctx.fillRect(cx - 75, cy - 25, 15, 6);
            ctx.fillRect(cx - 75, cy + 19, 15, 6);
            // Cockpit
            ctx.beginPath();
            ctx.arc(cx + 10, cy - 5, 15, Math.PI, 0);
            ctx.fill();
            // Wheels
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx + 50, cy + 18, 12, 8, 0, 0, Math.PI * 2);
            ctx.ellipse(cx - 40, cy + 18, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
          }, rotation);
        }
      },
    };
  }, [dimensions, drawAirfoil]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-background">
      {/* Particle canvas (bottom layer) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {/* Obstacle canvas (top layer - visible shape) */}
      <canvas
        ref={obstacleCanvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ opacity: 1 }}
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
