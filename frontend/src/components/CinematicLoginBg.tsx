'use client';

import React, { useEffect, useRef } from 'react';

interface CinematicLoginBgProps {
  pulseTrigger?: number;
  focusedField?: string | null;
}

export default function CinematicLoginBg({ pulseTrigger = 0, focusedField = null }: CinematicLoginBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const pulseRef = useRef({ active: false, radius: 0, maxRadius: 1000, alpha: 0 });

  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseRef.current = {
        active: true,
        radius: 30,
        maxRadius: 1000,
        alpha: 1.0,
      };
    }
  }, [pulseTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseRef.current.targetX = (e.clientX - cx) / cx;
      mouseRef.current.targetY = (e.clientY - cy) / cy;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // --- Starfield & Ambient Particle System ---
    const STAR_COUNT = 140;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.88,
      size: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.85 + 0.15,
      speed: Math.random() * 0.015 + 0.005,
      color: Math.random() > 0.4 ? '#38bdf8' : Math.random() > 0.5 ? '#a855f7' : '#ec4899',
    }));

    // Floating speed light streaks on perspective road
    const STREAK_COUNT = 50;
    const streaks = Array.from({ length: STREAK_COUNT }, () => ({
      z: Math.random(),
      speed: Math.random() * 0.009 + 0.005,
      lane: Math.random() * 2 - 1,
      length: Math.random() * 0.18 + 0.05,
      color: Math.random() > 0.5 ? '#06b6d4' : Math.random() > 0.5 ? '#8b5cf6' : '#3b82f6',
    }));

    // Electric sparks orbiting portal ring
    const SPARK_COUNT = 70;
    const sparks = Array.from({ length: SPARK_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 130 + Math.random() * 55,
      speed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
      size: Math.random() * 2.5 + 1,
      color: Math.random() > 0.3 ? '#38bdf8' : '#c084fc',
    }));

    // =========================================================================
    // --- 1. DENSE ANATOMICAL DIGITAL HUMAN FACE LANDMARKS & MESH ---
    // =========================================================================
    // 38 Normalized Points defining a realistic 3D Cyberpunk Human Head & Face Profile (Facing Right)
    const faceLandmarks = [
      // Top of Head & Skull Arc
      { x: -35, y: -105, group: 'skull' },
      { x: -18, y: -108, group: 'skull' },
      { x: 0, y: -98, group: 'skull' },
      { x: -55, y: -90, group: 'skull' },
      { x: -75, y: -65, group: 'skull' },
      { x: -85, y: -30, group: 'skull' },
      { x: -85, y: 15, group: 'skull' },
      { x: -75, y: 55, group: 'skull' },
      { x: -55, y: 85, group: 'neck' },
      { x: -25, y: 100, group: 'neck' },

      // Forehead & Temple
      { x: -25, y: -78, group: 'forehead' },
      { x: -8, y: -72, group: 'forehead' },
      { x: 12, y: -52, group: 'forehead' }, // Brow ridge top
      { x: -35, y: -45, group: 'temple' },
      { x: -12, y: -48, group: 'temple' },

      // Cyber Eye & Orbit
      { x: 10, y: -36, group: 'eye' }, // Outer Eye Corner / Iris
      { x: -2, y: -36, group: 'eye' },  // Inner Eye Corner
      { x: 5, y: -44, group: 'eye' },   // Upper Eyelid
      { x: 5, y: -28, group: 'eye' },   // Lower Eyelid

      // Nose Structure
      { x: -2, y: -24, group: 'nose' },  // Nose Bridge
      { x: 18, y: -12, group: 'nose' },  // Nose Tip
      { x: 2, y: -2, group: 'nose' },    // Nose Base / Nostril
      { x: -18, y: -18, group: 'nose' }, // Nose Side

      // Cheekbone & Mid Face
      { x: -35, y: -18, group: 'cheek' },
      { x: -15, y: -8, group: 'cheek' },
      { x: -38, y: 12, group: 'cheek' },

      // Mouth & Lips
      { x: 12, y: 10, group: 'mouth' },   // Upper Lip Tip
      { x: -2, y: 16, group: 'mouth' },   // Mouth Corner
      { x: 10, y: 24, group: 'mouth' },   // Lower Lip Tip
      { x: 0, y: 32, group: 'mouth' },    // Below Lip

      // Chin & Jawline
      { x: 12, y: 48, group: 'jaw' },    // Chin Tip
      { x: -12, y: 58, group: 'jaw' },   // Jawline Mid
      { x: -45, y: 35, group: 'jaw' },   // Jaw Angle
      { x: -25, y: 80, group: 'neck' },  // Neck Front

      // Cyber Ear Structure
      { x: -52, y: -22, group: 'ear' },
      { x: -42, y: 0, group: 'ear' },
      { x: -50, y: 22, group: 'ear' },
    ];

    // Triangulated Mesh Connections for the Human Face
    const faceConnections: [number, number][] = [
      // Skull Contour
      [0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
      // Forehead & Temple Grid
      [1, 10], [2, 11], [11, 12], [10, 11], [10, 13], [11, 14], [13, 14], [14, 12],
      // Eye Orbit Grid
      [12, 17], [17, 15], [15, 18], [18, 16], [16, 12], [14, 16], [15, 19],
      // Nose Mesh
      [12, 19], [19, 20], [20, 21], [21, 22], [19, 22], [22, 24], [20, 26],
      // Cheek Mesh
      [14, 23], [23, 24], [24, 21], [23, 34], [34, 35], [35, 25], [25, 24],
      // Mouth Mesh
      [21, 26], [26, 27], [27, 28], [28, 29], [26, 28], [27, 29],
      // Jaw & Neck Mesh
      [29, 30], [30, 31], [31, 32], [32, 36], [36, 7], [31, 33], [33, 9], [32, 33],
      // Inner Fill Triangles
      [10, 3], [13, 4], [34, 5], [36, 6], [25, 32], [24, 27]
    ];

    // =========================================================================
    // --- 2. DENSE 3D NEURAL AI BRAIN NODE NETWORK ---
    // =========================================================================
    const brainNodes: { x: number; y: number; z: number; baseOffset: number; connections: number[] }[] = [
      // Left Cerebral Hemisphere
      { x: -42, y: -98, z: 0, baseOffset: 0, connections: [1, 2, 3] },
      { x: -15, y: -112, z: 12, baseOffset: 1, connections: [0, 2, 4] },
      { x: -68, y: -72, z: -15, baseOffset: 2, connections: [0, 1, 4, 5] },
      { x: -28, y: -68, z: 22, baseOffset: 3, connections: [0, 4, 6] },
      { x: -82, y: -18, z: -20, baseOffset: 4, connections: [1, 2, 3, 7] },
      { x: -45, y: -12, z: 28, baseOffset: 5, connections: [2, 6, 7] },
      { x: -75, y: 38, z: -10, baseOffset: 6, connections: [3, 5, 8] },
      { x: -35, y: 48, z: 18, baseOffset: 7, connections: [4, 5, 8] },
      { x: -48, y: 92, z: -5, baseOffset: 8, connections: [6, 7] },

      // Right Cerebral Hemisphere
      { x: 42, y: -98, z: 0, baseOffset: 9, connections: [10, 11, 12] },
      { x: 15, y: -112, z: 12, baseOffset: 10, connections: [9, 11, 13] },
      { x: 68, y: -72, z: -15, baseOffset: 11, connections: [9, 10, 13, 14] },
      { x: 28, y: -68, z: 22, baseOffset: 12, connections: [9, 13, 15] },
      { x: 82, y: -18, z: -20, baseOffset: 13, connections: [10, 11, 12, 16] },
      { x: 45, y: -12, z: 28, baseOffset: 14, connections: [11, 15, 16] },
      { x: 75, y: 38, z: -10, baseOffset: 15, connections: [12, 14, 17] },
      { x: 35, y: 48, z: 18, baseOffset: 16, connections: [13, 14, 17] },
      { x: 48, y: 92, z: -5, baseOffset: 17, connections: [15, 16] },

      // Central Synaptic Ridge & Cerebellum
      { x: 0, y: -85, z: 32, baseOffset: 18, connections: [0, 9, 1, 10] },
      { x: 0, y: -25, z: 38, baseOffset: 19, connections: [3, 12, 5, 14] },
      { x: 0, y: 55, z: 26, baseOffset: 20, connections: [7, 16, 8, 17] },
      { x: 0, y: 115, z: 0, baseOffset: 21, connections: [8, 17, 20] },
    ];

    let time = 0;

    const render = () => {
      time += 0.016;

      // Mouse lerp for smooth camera parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const cameraOffsetX = mouseRef.current.x * 20;
      const cameraOffsetY = mouseRef.current.y * 12;

      // Responsive Breakpoints
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1280;

      // Clear Canvas with Deep Midnight Navy Background
      ctx.fillStyle = '#04040a';
      ctx.fillRect(0, 0, width, height);

      // Deep Volumetric Background Glows
      const bgGrad1 = ctx.createRadialGradient(
        width * 0.5 + cameraOffsetX,
        height * 0.42 + cameraOffsetY,
        40,
        width * 0.5 + cameraOffsetX,
        height * 0.42 + cameraOffsetY,
        width * 0.65
      );
      bgGrad1.addColorStop(0, 'rgba(14, 34, 78, 0.52)');
      bgGrad1.addColorStop(0.5, 'rgba(16, 12, 48, 0.32)');
      bgGrad1.addColorStop(1, 'rgba(4, 4, 10, 1)');
      ctx.fillStyle = bgGrad1;
      ctx.fillRect(0, 0, width, height);

      // Cyan Ambient Halo (Left Side - Digital Human Head)
      const cyanOrb = ctx.createRadialGradient(
        width * 0.18 + cameraOffsetX * 1.5,
        height * 0.38 + cameraOffsetY * 1.5,
        10,
        width * 0.18 + cameraOffsetX * 1.5,
        height * 0.38 + cameraOffsetY * 1.5,
        380
      );
      cyanOrb.addColorStop(0, focusedField ? 'rgba(6, 182, 212, 0.38)' : 'rgba(6, 182, 212, 0.25)');
      cyanOrb.addColorStop(0.6, 'rgba(59, 130, 246, 0.1)');
      cyanOrb.addColorStop(1, 'transparent');
      ctx.fillStyle = cyanOrb;
      ctx.fillRect(0, 0, width, height);

      // Purple Ambient Halo (Right Side - AI Brain)
      const purpleOrb = ctx.createRadialGradient(
        width * 0.82 + cameraOffsetX * 1.5,
        height * 0.36 + cameraOffsetY * 1.5,
        10,
        width * 0.82 + cameraOffsetX * 1.5,
        height * 0.36 + cameraOffsetY * 1.5,
        400
      );
      purpleOrb.addColorStop(0, 'rgba(168, 85, 247, 0.28)');
      purpleOrb.addColorStop(0.6, 'rgba(139, 92, 246, 0.1)');
      purpleOrb.addColorStop(1, 'transparent');
      ctx.fillStyle = purpleOrb;
      ctx.fillRect(0, 0, width, height);

      // Twinkling Starfield
      stars.forEach((star) => {
        star.alpha += Math.sin(time * star.speed * 20) * 0.012;
        const currentAlpha = Math.max(0.12, Math.min(1, star.alpha));
        ctx.beginPath();
        ctx.arc(star.x + cameraOffsetX * 0.3, star.y + cameraOffsetY * 0.3, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // =========================================================================
      // --- BOTTOM PERSPECTIVE SYNTH GRID ROAD & SPEED LIGHT STREAKS ---
      // =========================================================================
      const horizonY = height * 0.60 + cameraOffsetY * 0.5;
      const portalCenterX = width * 0.5 + cameraOffsetX;
      const roadBottomWidth = width * 1.4;

      ctx.save();
      const gridLineCount = 36;
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridLineCount; i++) {
        const ratio = i / gridLineCount;
        const xBottom = portalCenterX - roadBottomWidth / 2 + ratio * roadBottomWidth;
        const gridGrad = ctx.createLinearGradient(xBottom, height, portalCenterX, horizonY);
        gridGrad.addColorStop(0, 'rgba(139, 92, 246, 0.42)');
        gridGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.32)');
        gridGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        ctx.strokeStyle = gridGrad;
        ctx.beginPath();
        ctx.moveTo(xBottom, height);
        ctx.lineTo(portalCenterX + (ratio - 0.5) * 70, horizonY + 30);
        ctx.stroke();
      }

      // Moving Grid Rows
      const gridRows = 18;
      for (let i = 0; i < gridRows; i++) {
        const progress = ((i / gridRows + time * 0.12) % 1);
        const pY = horizonY + Math.pow(progress, 2.2) * (height - horizonY);
        const currentWidth = ((pY - horizonY) / (height - horizonY)) * roadBottomWidth;
        const xLeft = portalCenterX - currentWidth / 2;
        const xRight = portalCenterX + currentWidth / 2;

        const rowGrad = ctx.createLinearGradient(xLeft, pY, xRight, pY);
        rowGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
        rowGrad.addColorStop(0.2, 'rgba(168, 85, 247, ' + progress * 0.45 + ')');
        rowGrad.addColorStop(0.5, 'rgba(56, 189, 248, ' + progress * 0.8 + ')');
        rowGrad.addColorStop(0.8, 'rgba(168, 85, 247, ' + progress * 0.45 + ')');
        rowGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.strokeStyle = rowGrad;
        ctx.beginPath();
        ctx.moveTo(xLeft, pY);
        ctx.lineTo(xRight, pY);
        ctx.stroke();
      }

      // Flowing Light Streaks Moving Toward Viewer
      streaks.forEach((streak) => {
        streak.z = (streak.z + streak.speed) % 1;
        const pYStart = horizonY + Math.pow(streak.z, 2.5) * (height - horizonY);
        const pYEnd = horizonY + Math.pow(Math.min(1, streak.z + streak.length), 2.5) * (height - horizonY);

        const widthAtStart = ((pYStart - horizonY) / (height - horizonY)) * (roadBottomWidth * 0.4);
        const widthAtEnd = ((pYEnd - horizonY) / (height - horizonY)) * (roadBottomWidth * 0.4);

        const xStart = portalCenterX + streak.lane * widthAtStart;
        const xEnd = portalCenterX + streak.lane * widthAtEnd;

        const streakGrad = ctx.createLinearGradient(xStart, pYStart, xEnd, pYEnd);
        streakGrad.addColorStop(0, 'transparent');
        streakGrad.addColorStop(0.5, streak.color);
        streakGrad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = Math.max(1.2, (pYStart - horizonY) * 0.03);
        ctx.beginPath();
        ctx.moveTo(xStart, pYStart);
        ctx.lineTo(xEnd, pYEnd);
        ctx.stroke();
      });
      ctx.restore();

      // =========================================================================
      // --- CENTRAL GLOWING PORTAL & ROTATING NEON ENERGY RINGS ---
      // =========================================================================
      const portalY = height * 0.43 + cameraOffsetY * 0.8;
      const portalRadius = Math.min(width, height) * (isMobile ? 0.22 : 0.20);

      ctx.save();
      ctx.translate(portalCenterX, portalY);

      // Volumetric Light Beams fanning out from portal
      for (let b = 0; b < 8; b++) {
        const bAngle = (b * Math.PI) / 4 + time * 0.1;
        const bx = Math.cos(bAngle) * portalRadius * 2.5;
        const by = Math.sin(bAngle) * portalRadius * 2.5;

        const bGrad = ctx.createLinearGradient(0, 0, bx, by);
        bGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
        bGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(bx - 25, by + 25);
        ctx.lineTo(bx + 25, by - 25);
        ctx.closePath();
        ctx.fill();
      }

      // Base Under-Glow Radial
      const baseUnderGlow = ctx.createRadialGradient(0, portalRadius * 0.8, 10, 0, portalRadius * 0.8, portalRadius * 2.4);
      baseUnderGlow.addColorStop(0, 'rgba(6, 182, 212, 0.58)');
      baseUnderGlow.addColorStop(0.4, 'rgba(124, 58, 237, 0.38)');
      baseUnderGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = baseUnderGlow;
      ctx.beginPath();
      ctx.ellipse(0, portalRadius * 0.9, portalRadius * 1.9, portalRadius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Energy Ring 1 (Magenta/Violet Dash) - Clockwise
      ctx.rotate(time * 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, portalRadius * 1.25, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([24, 38, 14, 28]);
      ctx.stroke();

      // Rotating Energy Ring 2 (Cyan Dash) - Counter-clockwise
      ctx.rotate(-time * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, portalRadius * 1.12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([48, 16, 10, 24]);
      ctx.stroke();

      // Main Circular Energy Portal Core Ring
      ctx.setLineDash([]);
      const mainRingGrad = ctx.createLinearGradient(-portalRadius, -portalRadius, portalRadius, portalRadius);
      mainRingGrad.addColorStop(0, '#38bdf8');
      mainRingGrad.addColorStop(0.33, '#8b5cf6');
      mainRingGrad.addColorStop(0.66, '#ec4899');
      mainRingGrad.addColorStop(1, '#06b6d4');

      ctx.beginPath();
      ctx.arc(0, 0, portalRadius, 0, Math.PI * 2);
      ctx.strokeStyle = mainRingGrad;
      ctx.lineWidth = 5.2 + Math.sin(time * 3) * 1.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 35;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner Core Atmosphere
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, portalRadius);
      coreGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      coreGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.18)');
      coreGrad.addColorStop(0.85, 'rgba(6, 182, 212, 0.28)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, portalRadius * 0.98, 0, Math.PI * 2);
      ctx.fill();

      // Electric Sparks Traveling along Ring Circumference
      sparks.forEach((spark) => {
        spark.angle += spark.speed;
        const sx = Math.cos(spark.angle) * (portalRadius * 1.08);
        const sy = Math.sin(spark.angle) * (portalRadius * 1.08);

        ctx.beginPath();
        ctx.arc(sx, sy, spark.size, 0, Math.PI * 2);
        ctx.fillStyle = spark.color;
        ctx.shadowColor = spark.color;
        ctx.shadowBlur = 12;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      ctx.restore();

      // Dynamic Scale & Positioning based on screen size
      const baseScale = Math.min(width, height);
      const faceScale = isMobile ? baseScale * 0.0011 : isTablet ? baseScale * 0.00145 : baseScale * 0.00175;
      const brainScale = isMobile ? baseScale * 0.0011 : isTablet ? baseScale * 0.00145 : baseScale * 0.00175;

      const faceCenterX = isMobile ? width * 0.14 + cameraOffsetX * 0.7 : isTablet ? width * 0.16 + cameraOffsetX * 0.7 : width * 0.18 + cameraOffsetX * 0.7;
      const brainCenterX = isMobile ? width * 0.86 + cameraOffsetX * 0.7 : isTablet ? width * 0.84 + cameraOffsetX * 0.7 : width * 0.82 + cameraOffsetX * 0.7;
      const sideAlpha = isMobile ? 0.4 : 1.0;

      // =========================================================================
      // --- LEFT SIDE: MASTERPIECE HOLOGRAPHIC DIGITAL HUMAN HEAD & FACE ---
      // =========================================================================
      const faceCenterY = height * 0.38 + cameraOffsetY * 0.7;

      ctx.save();
      ctx.translate(faceCenterX, faceCenterY);
      ctx.scale(faceScale, faceScale);
      ctx.globalAlpha = sideAlpha;

      // 1. Soft Volumetric Neon Silhouette Fill behind Face
      ctx.beginPath();
      ctx.moveTo(faceLandmarks[0].x, faceLandmarks[0].y);
      faceLandmarks.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.closePath();

      const faceFillGrad = ctx.createLinearGradient(-80, -100, 20, 100);
      faceFillGrad.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
      faceFillGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.12)');
      faceFillGrad.addColorStop(1, 'rgba(139, 92, 246, 0.08)');
      ctx.fillStyle = faceFillGrad;
      ctx.fill();

      // 2. Outer Neon Head Silhouette Outline Beam
      ctx.beginPath();
      ctx.moveTo(faceLandmarks[0].x, faceLandmarks[0].y);
      [1, 2, 11, 12, 17, 15, 19, 20, 21, 26, 28, 29, 30, 31, 33, 9, 8, 7, 6, 5, 4, 3, 0].forEach((idx) => {
        ctx.lineTo(faceLandmarks[idx].x, faceLandmarks[idx].y);
      });
      ctx.closePath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Dense Wireframe Facial Grid Lines
      ctx.lineWidth = 1.1;
      faceConnections.forEach(([i1, i2], idx) => {
        const p1 = faceLandmarks[i1];
        const p2 = faceLandmarks[i2];

        const seqIllum = Math.sin(time * 3.5 - idx * 0.3) > 0.1;
        const edgeGrad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        edgeGrad.addColorStop(0, seqIllum ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)');
        edgeGrad.addColorStop(1, 'rgba(168, 85, 247, 0.5)');

        ctx.strokeStyle = edgeGrad;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Data particles traveling along facial grid
        const pProg = (time * 0.9 + idx * 0.12) % 1;
        const px = p1.x + (p2.x - p1.x) * pProg;
        const py = p1.y + (p2.y - p1.y) * pProg;

        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Facial Nodes (Landmarks)
      faceLandmarks.forEach((p, idx) => {
        const nPulse = 2.2 + Math.sin(time * 3.5 + idx) * 1.0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nPulse, 0, Math.PI * 2);
        ctx.fillStyle = idx % 3 === 0 ? '#38bdf8' : idx % 3 === 1 ? '#c084fc' : '#06b6d4';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. Glowing Cybernetic Eye Iris
      const eyePt = faceLandmarks[15]; // Outer Eye
      ctx.beginPath();
      ctx.arc(eyePt.x, eyePt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 6. Temple Biometric HUD Ring
      ctx.save();
      ctx.translate(-25, -60);
      ctx.rotate(time * 0.4);

      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([10, 14, 4, 10]);
      ctx.stroke();

      ctx.rotate(-time * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([16, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 7. Holographic Laser Scan Line sweeping across face
      const faceScanY = -115 + ((time * 65) % 220);
      const faceScanGrad = ctx.createLinearGradient(0, faceScanY - 6, 0, faceScanY + 6);
      faceScanGrad.addColorStop(0, 'transparent');
      faceScanGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.6)');
      faceScanGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = faceScanGrad;
      ctx.fillRect(-90, faceScanY - 6, 120, 12);

      // HUD Metrics Label
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.font = '700 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('BIOMETRIC_ID: ACTIVE', -80, -125);
      ctx.fillText('FACIAL_SYNAPSE: 99.9%', -80, -113);

      ctx.restore();

      // =========================================================================
      // --- RIGHT SIDE: MASTERPIECE 3D ANATOMICAL AI BRAIN GRAPHIC ---
      // =========================================================================
      const brainCenterY = height * 0.38 + cameraOffsetY * 0.7;

      ctx.save();
      ctx.translate(brainCenterX, brainCenterY);
      ctx.scale(brainScale, brainScale);
      ctx.globalAlpha = sideAlpha;

      // Brain Halo Glow
      const brainGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 180);
      brainGlow.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
      brainGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.12)');
      brainGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = brainGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.fill();

      // 1. Sleek Tech Pills Orbiting around Brain
      const techBadges = [
        { name: 'TS', color: '#3178c6', angle: 0 },
        { name: 'PYTHON', color: '#3776ab', angle: Math.PI / 3 },
        { name: 'RUST', color: '#de4123', angle: (2 * Math.PI) / 3 },
        { name: 'C++', color: '#00599c', angle: Math.PI },
        { name: 'NODE.JS', color: '#539e43', angle: (4 * Math.PI) / 3 },
        { name: 'NEXT.JS', color: '#ffffff', angle: (5 * Math.PI) / 3 },
      ];

      const orbitRadiusX = 145;
      const orbitRadiusY = 105;

      techBadges.forEach((badge) => {
        const curAngle = badge.angle + time * 0.35;
        const lx = Math.cos(curAngle) * orbitRadiusX;
        const ly = Math.sin(curAngle) * orbitRadiusY;

        ctx.save();
        ctx.translate(lx, ly);

        ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
        ctx.strokeStyle = badge.color;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = badge.color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.roundRect(-22, -10, 44, 20, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge.name, 0, 1);

        ctx.restore();

        // Synapse Ray from Orbit Pill to Central AI Chip
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(0, 0);
        ctx.stroke();
      });

      // 2. Anatomical 3D Neural Synapse Graph
      ctx.lineWidth = 1.2;
      brainNodes.forEach((node, i) => {
        const nx = node.x + Math.sin(time * 2 + node.baseOffset) * 2;
        const ny = node.y + Math.cos(time * 2 + node.baseOffset) * 2;

        node.connections.forEach((targetIdx) => {
          if (targetIdx > i) {
            const targetNode = brainNodes[targetIdx];
            const tx = targetNode.x + Math.sin(time * 2 + targetNode.baseOffset) * 2;
            const ty = targetNode.y + Math.cos(time * 2 + targetNode.baseOffset) * 2;

            const edgeAlpha = 0.35 + Math.sin(time * 2.5 + node.baseOffset) * 0.2;
            ctx.strokeStyle = `rgba(56, 189, 248, ${edgeAlpha})`;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            // Synapse Data Pulse Packets
            const pulseProg = (time * 0.9 + node.baseOffset * 0.25) % 1;
            const px = nx + (tx - nx) * pulseProg;
            const py = ny + (ty - ny) * pulseProg;

            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // Neural Node Dot
        const nodePulseSize = 3.2 + Math.sin(time * 4 + node.baseOffset) * 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, nodePulseSize, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#c084fc';
        ctx.shadowColor = i % 2 === 0 ? '#38bdf8' : '#c084fc';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Central AI Microchip Core
      ctx.fillStyle = 'rgba(8, 8, 20, 0.95)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 22;

      ctx.beginPath();
      ctx.roundRect(-30, -26, 60, 52, 10);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Chip Pins Radiating
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)';
      ctx.lineWidth = 1.6;
      [-20, -7, 7, 20].forEach((px) => {
        ctx.beginPath();
        ctx.moveTo(px, -26);
        ctx.lineTo(px, -32);
        ctx.moveTo(px, 26);
        ctx.lineTo(px, 32);
        ctx.stroke();
      });

      // Sharp "AI" Text on Microchip
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AI', 0, 1);

      // 4. Holographic Laser Beam passing across Brain
      const scanY = -125 + ((time * 75) % 250);
      const brainScanGrad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
      brainScanGrad.addColorStop(0, 'transparent');
      brainScanGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.6)');
      brainScanGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = brainScanGrad;
      ctx.fillRect(-130, scanY - 8, 260, 16);

      // HUD Status Metrics
      ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.font = '700 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('NEURAL_SYNC: 99.8%', -125, -135);
      ctx.fillText('SYNAPSE_FPS: 60', -125, -123);
      ctx.fillText('AI_CORE: ONLINE', -125, -111);

      ctx.restore();

      // =========================================================================
      // --- INTERACTIVE ENERGY SHOCKWAVE PULSE ---
      // =========================================================================
      if (pulseRef.current.active) {
        pulseRef.current.radius += 28;
        pulseRef.current.alpha *= 0.94;

        if (pulseRef.current.radius > pulseRef.current.maxRadius || pulseRef.current.alpha < 0.01) {
          pulseRef.current.active = false;
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(portalCenterX, portalY, pulseRef.current.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${pulseRef.current.alpha * 0.85})`;
          ctx.lineWidth = 6;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 38;
          ctx.stroke();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [focusedField]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#04040a]">
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating UI Badges - Positioned Tastefully around the Center Card */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left: Chat Icon */}
        <div className="absolute top-[16%] left-[14%] animate-float transition-all duration-700 hover:scale-110">
          <div className="p-3.5 rounded-2xl bg-[#0e0e1a]/70 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center relative group">
            <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-sm group-hover:bg-cyan-500/40 transition-all" />
            <svg className="w-6 h-6 text-cyan-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>

        {/* Top Right: Image Icon */}
        <div className="absolute top-[15%] right-[14%] animate-float [animation-delay:1.5s] transition-all duration-700 hover:scale-110">
          <div className="p-3.5 rounded-2xl bg-[#0e0e1a]/70 backdrop-blur-md border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center relative group">
            <div className="absolute -inset-1 rounded-2xl bg-purple-500/20 blur-sm group-hover:bg-purple-500/40 transition-all" />
            <svg className="w-6 h-6 text-purple-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Bottom Left: Code Icon */}
        <div className="absolute bottom-[22%] left-[15%] animate-float [animation-delay:3s] transition-all duration-700 hover:scale-110">
          <div className="p-3.5 rounded-2xl bg-[#0e0e1a]/70 backdrop-blur-md border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.35)] flex items-center justify-center relative group">
            <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-sm group-hover:bg-blue-500/40 transition-all" />
            <svg className="w-6 h-6 text-blue-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        </div>

        {/* Bottom Right: Document Icon */}
        <div className="absolute bottom-[20%] right-[15%] animate-float [animation-delay:2s] transition-all duration-700 hover:scale-110">
          <div className="p-3.5 rounded-2xl bg-[#0e0e1a]/70 backdrop-blur-md border border-pink-500/40 shadow-[0_0_25px_rgba(236,72,153,0.35)] flex items-center justify-center relative group">
            <div className="absolute -inset-1 rounded-2xl bg-pink-500/20 blur-sm group-hover:bg-pink-500/40 transition-all" />
            <svg className="w-6 h-6 text-pink-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
