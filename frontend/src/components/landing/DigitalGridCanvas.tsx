'use client';

import React, { useEffect, useRef } from 'react';

export default function DigitalGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse position for parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Particles Data
    const particleCount = Math.min(80, Math.floor(width / 18));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.4 + 0.1),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.5 ? 'rgba(56, 189, 248, ' : 'rgba(168, 85, 247, ',
    }));

    // Grid terrain parameters
    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const parallaxX = (mouseX - width / 2) * 0.04;
      const parallaxY = (mouseY - height / 2) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Subtle Ambient Radial Gradients
      const cyanGlow = ctx.createRadialGradient(
        width * 0.25 + parallaxX,
        height * 0.4 + parallaxY,
        10,
        width * 0.25 + parallaxX,
        height * 0.4 + parallaxY,
        width * 0.45
      );
      cyanGlow.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
      cyanGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.04)');
      cyanGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, width, height);

      const purpleGlow = ctx.createRadialGradient(
        width * 0.75 + parallaxX,
        height * 0.4 + parallaxY,
        10,
        width * 0.75 + parallaxX,
        height * 0.4 + parallaxY,
        width * 0.45
      );
      purpleGlow.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
      purpleGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
      purpleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = purpleGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Connected Particle Network Lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0 || p.x > width) {
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x + parallaxX * 0.3, p.y + parallaxY * 0.3, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();

        // Connect nearby particles with subtle network lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x + parallaxX * 0.3, p.y + parallaxY * 0.3);
            ctx.lineTo(p2.x + parallaxX * 0.3, p2.y + parallaxY * 0.3);
            const lineOpacity = (1 - dist / 110) * 0.15;
            ctx.strokeStyle = p.x < width / 2 ? `rgba(56, 189, 248, ${lineOpacity})` : `rgba(168, 85, 247, ${lineOpacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Draw Perspective 3D Wave Grid (Digital Terrain at Bottom)
      const horizonY = height * 0.62 + parallaxY * 0.2;
      const gridRows = 24;
      const gridCols = 32;
      const fov = 320;

      ctx.save();
      ctx.lineWidth = 1;

      // Draw longitudinal perspective lines
      for (let col = 0; col <= gridCols; col++) {
        const normCol = (col / gridCols - 0.5) * 2.4; // -1.2 to 1.2
        const startX = width / 2 + normCol * 10;
        const endX = width / 2 + normCol * (width * 0.85);

        ctx.beginPath();
        ctx.moveTo(startX + parallaxX * 0.1, horizonY);
        ctx.lineTo(endX + parallaxX * 0.5, height);

        const colGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        if (normCol < 0) {
          colGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
          colGrad.addColorStop(1, 'rgba(14, 165, 233, 0.45)');
        } else {
          colGrad.addColorStop(0, 'rgba(168, 85, 247, 0.05)');
          colGrad.addColorStop(1, 'rgba(147, 51, 234, 0.45)');
        }

        ctx.strokeStyle = colGrad;
        ctx.stroke();
      }

      // Draw horizontal undulating sine wave grid lines moving forward
      for (let row = 1; row <= gridRows; row++) {
        const z = (row + (time % 1)) / gridRows; // 0.0 to 1.0 (moving forward)
        const rowY = horizonY + z * z * (height - horizonY);

        const waveAmp = (1 - z) * 12 * Math.sin(time * 2 + row * 0.4);
        const alpha = z * z * 0.5;

        ctx.beginPath();
        for (let col = 0; col <= gridCols; col++) {
          const normCol = (col / gridCols - 0.5) * 2.4;
          const x = width / 2 + normCol * (startXRatio(z) * width);
          const y = rowY + Math.sin(time * 3 + col * 0.3) * waveAmp;

          if (col === 0) ctx.moveTo(x + parallaxX * z, y);
          else ctx.lineTo(x + parallaxX * z, y);
        }

        const rowGrad = ctx.createLinearGradient(0, 0, width, 0);
        rowGrad.addColorStop(0, `rgba(56, 189, 248, ${alpha})`);
        rowGrad.addColorStop(0.5, `rgba(129, 140, 248, ${alpha * 1.2})`);
        rowGrad.addColorStop(1, `rgba(168, 85, 247, ${alpha})`);

        ctx.strokeStyle = rowGrad;
        ctx.stroke();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    function startXRatio(z: number) {
      return 0.05 + z * 0.75;
    }

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}
