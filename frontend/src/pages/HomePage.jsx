import React, { useState, useEffect, useRef } from 'react';

const HomePage = ({ onNavigateToDashboard }) => {
    const [scrolledPastHero, setScrolledPastHero] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState({ three: false, anime: false });
    const [currentVibe, setCurrentVibe] = useState(0); // 0: Cyan, 1: Amber, 2: Purple, 3: Emerald
    
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const dashboardCtaRef = useRef(null);

    // Dynamic state trackers for WebGL mouse mechanics
    const mouseRef = useRef({ 
        x: 0, 
        y: 0, 
        targetX: 0, 
        targetY: 0, 
        isDown: false, 
        waves: [],
        worldX: 0,
        worldY: 0
    });
    const scrollPercentRef = useRef(0);
    const colorThemeRef = useRef({ r: 0.0, g: 0.95, b: 1.0 }); // Dynamic particle target color

    // 1. Asynchronously fetch Three.js and Anime.js CDN dependencies
    useEffect(() => {
        let threeScript, animeScript;

        const checkCompletion = () => {
            if (window.THREE && window.anime) {
                setScriptsLoaded({ three: true, anime: true });
            }
        };

        if (!window.THREE) {
            threeScript = document.createElement('script');
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            threeScript.async = true;
            threeScript.onload = () => {
                setScriptsLoaded(prev => ({ ...prev, three: true }));
                checkCompletion();
            };
            document.body.appendChild(threeScript);
        } else {
            setScriptsLoaded(prev => ({ ...prev, three: true }));
        }

        if (!window.anime) {
            animeScript = document.createElement('script');
            animeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
            animeScript.async = true;
            animeScript.onload = () => {
                setScriptsLoaded(prev => ({ ...prev, anime: true }));
                checkCompletion();
            };
            document.body.appendChild(animeScript);
        } else {
            setScriptsLoaded(prev => ({ ...prev, anime: true }));
        }

        checkCompletion();

        return () => {
            if (threeScript && document.body.contains(threeScript)) document.body.removeChild(threeScript);
            if (animeScript && document.body.contains(animeScript)) document.body.removeChild(animeScript);
        };
    }, []);

    // 2. Track Window Scroll Depth, active sections, and background vibe
    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const scrollFraction = scrollHeight > 0 ? currentScroll / scrollHeight : 0;
            scrollPercentRef.current = scrollFraction;

            // Determine current active section for styling overlays
            const activeVibe = Math.min(3, Math.floor(scrollFraction * 4));
            setCurrentVibe(activeVibe);

            // Realign colors inside the WebGL render loop smoothly
            if (activeVibe === 0) {
                colorThemeRef.current = { r: 0.0, g: 0.95, b: 1.0 }; // Cyan
            } else if (activeVibe === 1) {
                colorThemeRef.current = { r: 0.98, g: 0.45, b: 0.07 }; // Vibrant Orange
            } else if (activeVibe === 2) {
                colorThemeRef.current = { r: 0.64, g: 0.35, b: 1.0 }; // Royal Purple
            } else {
                colorThemeRef.current = { r: 0.92, g: 0.68, b: 0.0 }; // Golden Amber
            }

            const scrollThreshold = window.innerHeight * 0.45;
            if (currentScroll > scrollThreshold) {
                if (!scrolledPastHero) {
                    setScrolledPastHero(true);
                }
            } else {
                setScrolledPastHero(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolledPastHero]);

    // 3. WebGL / Three.js Interactive Core Loop
    useEffect(() => {
        if (!scriptsLoaded.three) return;

        const THREE = window.THREE;
        
        // Setup Canvas container parameters
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height, false);

        // Core Particle Config
        const count = 1500;
        const geometry = new THREE.BufferGeometry();
        
        // Generate coordinates for 4 shapes (Sphere, Hollow Cube, Wave plane, Singularity)
        const sPositions = new Float32Array(count * 3);
        const cPositions = new Float32Array(count * 3);
        const wPositions = new Float32Array(count * 3);
        const vPositions = new Float32Array(count * 3);
        
        const currentPositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Shape 1: Cybernetic Neural Sphere (Hero Area)
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const radius = 5 + Math.random() * 0.5;
            sPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            sPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            sPositions[i3 + 2] = radius * Math.cos(phi);

            // Shape 2: Structural Hollow Cube (Theory Area - Distributed on faces)
            const side = 7.5; // Fixed dimension of the cube edges
            const faceIndex = Math.floor(Math.random() * 6); // Pick 1 of 6 outer faces
            const axisValue = (Math.random() - 0.5) * side;
            const secondAxisValue = (Math.random() - 0.5) * side;
            const fixedValue = side / 2;

            if (faceIndex === 0) { // Right Face (+X)
                cPositions[i3] = fixedValue;
                cPositions[i3 + 1] = axisValue;
                cPositions[i3 + 2] = secondAxisValue;
            } else if (faceIndex === 1) { // Left Face (-X)
                cPositions[i3] = -fixedValue;
                cPositions[i3 + 1] = axisValue;
                cPositions[i3 + 2] = secondAxisValue;
            } else if (faceIndex === 2) { // Top Face (+Y)
                cPositions[i3] = axisValue;
                cPositions[i3 + 1] = fixedValue;
                cPositions[i3 + 2] = secondAxisValue;
            } else if (faceIndex === 3) { // Bottom Face (-Y)
                cPositions[i3] = axisValue;
                cPositions[i3 + 1] = -fixedValue;
                cPositions[i3 + 2] = secondAxisValue;
            } else if (faceIndex === 4) { // Front Face (+Z)
                cPositions[i3] = axisValue;
                cPositions[i3 + 1] = secondAxisValue;
                cPositions[i3 + 2] = fixedValue;
            } else { // Back Face (-Z)
                cPositions[i3] = axisValue;
                cPositions[i3 + 1] = secondAxisValue;
                cPositions[i3 + 2] = -fixedValue;
            }

            // Shape 3: Defense Terrain Plane Grid (Resume Area)
            wPositions[i3] = (Math.random() - 0.5) * 20;
            wPositions[i3 + 1] = (Math.random() - 0.5) * 12;
            wPositions[i3 + 2] = Math.sin(wPositions[i3] * 0.5) * Math.cos(wPositions[i3 + 1] * 0.5) * 1.5;

            // Shape 4: Singularity Compression Warp Vortex (Dashboard Area)
            const angle = Math.random() * Math.PI * 2;
            const dist = 0.5 + Math.random() * 8.0;
            vPositions[i3] = Math.cos(angle) * dist;
            vPositions[i3 + 1] = Math.sin(angle) * dist;
            vPositions[i3 + 2] = (Math.random() - 0.5) * (10.0 / dist);

            // Set Initial positions to sphere
            currentPositions[i3] = sPositions[i3];
            currentPositions[i3 + 1] = sPositions[i3 + 1];
            currentPositions[i3 + 2] = sPositions[i3 + 2];

            // Initial colors
            colors[i3] = 0.0;
            colors[i3 + 1] = 0.95;
            colors[i3 + 2] = 1.0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create glowing procedural particle textures
        const particleCanvas = document.createElement('canvas');
        particleCanvas.width = 32;
        particleCanvas.height = 32;
        const ctx = particleCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(particleCanvas);
        const material = new THREE.PointsMaterial({
            size: 0.18,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: texture
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const handleResize = () => {
            if (!canvasRef.current) return;
            const w = canvasRef.current.clientWidth;
            const h = canvasRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        window.addEventListener('resize', handleResize);

        // Core Desktop Pointer Mechanics
        const onMouseMove = (e) => {
            mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        const onMouseDown = (e) => {
            if (e.button === 0) { // Left-click only
                mouseRef.current.isDown = true;
                mouseRef.current.waves.push({
                    x: mouseRef.current.worldX,
                    y: mouseRef.current.worldY,
                    progress: 0.0,
                    intensity: 1.0
                });
            }
        };

        const onMouseUp = () => {
            mouseRef.current.isDown = false;
        };

        // Core Mobile Adaptive Touch Mechanics
        const onTouchMove = (e) => {
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                mouseRef.current.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
                mouseRef.current.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
            }
        };

        const onTouchStart = (e) => {
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                mouseRef.current.isDown = true;
                mouseRef.current.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
                mouseRef.current.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
                
                mouseRef.current.waves.push({
                    x: mouseRef.current.worldX,
                    y: mouseRef.current.worldY,
                    progress: 0.0,
                    intensity: 1.2
                });
            }
        };

        const onTouchEnd = () => {
            mouseRef.current.isDown = false;
        };

        // Mount listeners globally to bypass overlay occlusions
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });

        // Core animation ticking cycle
        let clock = new THREE.Clock();
        let animationFrameId;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();
            const positionsAttr = geometry.attributes.position;
            const colorsAttr = geometry.attributes.color;

            // Interpolate mouse dampening coordinates
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

            mouseRef.current.waves.forEach((w) => {
                const currentRadius = w.progress;
                const expansionRate = Math.min(0.04, 0.008 + (currentRadius * 0.015));
                w.progress += expansionRate;
                w.intensity *= 0.995;
            });
            mouseRef.current.waves = mouseRef.current.waves.filter(w => w.intensity > 0.001);

            // Precise unprojection of NDC coordinates to compute world space cursor point on Z=0 plane
            const tempVector = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5);
            tempVector.unproject(camera);
            const dir = tempVector.sub(camera.position).normalize();
            const distancePlane = -camera.position.z / dir.z;
            const worldMouse = camera.position.clone().add(dir.multiplyScalar(distancePlane));
            
            // Retain calculated positions globally
            mouseRef.current.worldX = worldMouse.x;
            mouseRef.current.worldY = worldMouse.y;

            // Clamp active index range calculation strictly to 2.0 to resolve the wrap-around vortex pop bug
            const scrollFraction = scrollPercentRef.current;
            const t = scrollFraction * 3.0; // 0.0 to 3.0
            
            let activeShapeIndex = Math.floor(t);
            if (activeShapeIndex >= 3) {
                activeShapeIndex = 2; // Prevents index 3 wrap-around from breaking base coordinates
            }
            
            const rawLocalTransition = t - activeShapeIndex;
            const clampedLocal = Math.max(0, Math.min(1, rawLocalTransition));

            // Apply a cubic ease-in-out S-curve to local transitions. 
            // This flatlines near 0 and 1, creating a magnetic locking/resistance lock at each exact phase!
            const easedTransition = clampedLocal < 0.5 
                ? 4 * clampedLocal * clampedLocal * clampedLocal 
                : 1 - Math.pow(-2 * clampedLocal + 2, 3) / 2;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;

                // Base coordinates interpolation paths
                let xStart = 0, yStart = 0, zStart = 0;
                let xEnd = 0, yEnd = 0, zEnd = 0;

                if (activeShapeIndex === 0) {
                    xStart = sPositions[i3]; yStart = sPositions[i3+1]; zStart = sPositions[i3+2];
                    xEnd = cPositions[i3]; yEnd = cPositions[i3+1]; zEnd = cPositions[i3+2];
                } else if (activeShapeIndex === 1) {
                    xStart = cPositions[i3]; yStart = cPositions[i3+1]; zStart = cPositions[i3+2];
                    xEnd = wPositions[i3]; yEnd = wPositions[i3+1]; zEnd = wPositions[i3+2];
                } else {
                    xStart = wPositions[i3]; yStart = wPositions[i3+1]; zStart = wPositions[i3+2];
                    xEnd = vPositions[i3]; yEnd = vPositions[i3+1]; zEnd = vPositions[i3+2];
                }

                // Smooth linear interpolation using the magnetic lock eased transition curve
                let bx = xStart + (xEnd - xStart) * easedTransition;
                let by = yStart + (yEnd - yStart) * easedTransition;
                let bz = zStart + (zEnd - zStart) * easedTransition;

                // 1. Magnetic Repulsion Field (Cursor pushes particles away smoothly)
                const dx = bx - worldMouse.x;
                const dy = by - worldMouse.y;
                const distToMouse = Math.sqrt(dx*dx + dy*dy) + 0.1;
                
                if (distToMouse < 4.5) {
                    // Push force scale curves quadratically as cursor approaches
                    const pushFactor = Math.pow((4.5 - distToMouse) / 4.5, 1.5) * 2.5;
                    bx += (dx / distToMouse) * pushFactor;
                    by += (dy / distToMouse) * pushFactor;
                }

                // 2. Heavy, Propagating Expanding Ring Wavefront with slow recovery (Left click)
                if (mouseRef.current.waves.length > 0) {
                    mouseRef.current.waves.forEach((w) => {
                        const clickDx = bx - w.x;
                        const clickDy = by - w.y;
                        const clickDist = Math.sqrt(clickDx*clickDx + clickDy*clickDy) + 0.1;
                        
                        const waveRadius = w.progress;
                        const distToWavefront = Math.abs(clickDist - waveRadius);
                        
                        if (distToWavefront < 5.0) {
                            const waveEnvelope = Math.max(0, 1.0 - (distToWavefront / 5.0));
                            const waveChargeModifier = Math.min(1.0, waveRadius * 0.3);
                            const wavePush = waveEnvelope * w.intensity * waveChargeModifier * 6.5;
                            
                            bx += (clickDx / clickDist) * wavePush;
                            by += (clickDy / clickDist) * wavePush;
                        }
                    });
                }

                // Natural wave movement
                const waveFactor = Math.cos(elapsed * 1.5 + (bx * 0.25)) * 0.15;

                positionsAttr.array[i3] = bx + waveFactor;
                positionsAttr.array[i3 + 1] = by + waveFactor;
                positionsAttr.array[i3 + 2] = bz;

                // Color interpolation loops
                colorsAttr.array[i3] += (colorThemeRef.current.r - colorsAttr.array[i3]) * 0.05;
                colorsAttr.array[i3 + 1] += (colorThemeRef.current.g - colorsAttr.array[i3 + 1]) * 0.05;
                colorsAttr.array[i3 + 2] += (colorThemeRef.current.b - colorsAttr.array[i3 + 2]) * 0.05;
            }

            positionsAttr.needsUpdate = true;
            colorsAttr.needsUpdate = true;

            // Camera reacts gently to cursor position
            camera.position.x += (mouseRef.current.x * 1.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseRef.current.y * 1.5 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);

            // Transition-damped rotation (only progresses visibly with scroll fraction)
            const slowBaseRotation = elapsed * 0.01;
            const scrollTransitionPivot = scrollFraction * Math.PI * 0.25; // Gentle, elegant turn on scroll
            points.rotation.y = slowBaseRotation + scrollTransitionPivot;
            points.rotation.x = elapsed * 0.005;

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchend', onTouchEnd);
            renderer.dispose();
        };
    }, [scriptsLoaded.three]);

    // 4. Anime.js Text Revelations
    useEffect(() => {
        if (!scriptsLoaded.anime || !window.anime) return;
        const anime = window.anime;

        anime({
            targets: '.intro-reveal',
            translateY: [40, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1600,
            delay: (el, i) => i * 150
        });
    }, [scriptsLoaded.anime]);

    // Dynamic color utilities for Corner Frames
    const getCornerBorderClass = () => {
        if (currentVibe === 0) return 'border-appCyan/30 shadow-appCyan/5';
        if (currentVibe === 1) return 'border-appGold/30 shadow-appGold/5';
        if (currentVibe === 2) return 'border-purple-500/30 shadow-purple-500/5';
        return 'border-emerald-500/30 shadow-emerald-500/5';
    };

    const getCornerCrosshairClass = () => {
        if (currentVibe === 0) return 'bg-appCyan';
        if (currentVibe === 1) return 'bg-appGold';
        if (currentVibe === 2) return 'bg-purple-500';
        return 'bg-emerald-500';
    };

    return (
        <div ref={containerRef} className="relative min-h-[400vh] bg-[#070a13] text-white overflow-hidden font-sans select-none transition-colors duration-1000">
            
            {/* BACKGROUND CANVAS FRAME */}
            <div className="fixed inset-0 w-full h-full pointer-events-auto z-0">
                <canvas ref={canvasRef} className="w-full h-full block" />
                <div className="absolute inset-0 bg-radial-vortex pointer-events-none" />
            </div>

            {/* INTEGRATED MODERN CORNER GEOMETRY (Fills screen without text labels) */}
            <div className="fixed inset-0 pointer-events-none z-30 p-8">
                <div className="relative w-full h-full">
                    {/* Top Left Premium Frame */}
                    <div className={`absolute top-0 left-0 w-24 h-24 border-t border-l rounded-tl-3xl transition-all duration-1000 shadow-2xl flex items-start justify-start p-2 ${getCornerBorderClass()}`}>
                        <div className={`w-1 h-1 rounded-full animate-ping ${getCornerCrosshairClass()}`} />
                        <div className="w-[1px] h-6 bg-white/5 absolute left-6 top-0" />
                        <div className="h-[1px] w-6 bg-white/5 absolute top-6 left-0" />
                    </div>

                    {/* Top Right Premium Frame */}
                    <div className={`absolute top-0 right-0 w-24 h-24 border-t border-r rounded-tr-3xl transition-all duration-1000 shadow-2xl flex items-start justify-end p-2 ${getCornerBorderClass()}`}>
                        <div className={`w-1 h-1 rounded-full ${getCornerCrosshairClass()}`} />
                        <div className="w-[1px] h-6 bg-white/5 absolute right-6 top-0" />
                        <div className="h-[1px] w-6 bg-white/5 absolute top-6 right-0" />
                    </div>

                    {/* Bottom Left Premium Frame */}
                    <div className={`absolute bottom-0 left-0 w-24 h-24 border-b border-l rounded-bl-3xl transition-all duration-1000 shadow-2xl flex items-end justify-start p-2 ${getCornerBorderClass()}`}>
                        <div className={`w-1 h-1 rounded-full ${getCornerCrosshairClass()}`} />
                        <div className="w-[1px] h-6 bg-white/5 absolute left-6 bottom-0" />
                        <div className="h-[1px] w-6 bg-white/5 absolute bottom-6 left-0" />
                    </div>

                    {/* Bottom Right Premium Frame */}
                    <div className={`absolute bottom-0 right-0 w-24 h-24 border-b border-r rounded-br-3xl transition-all duration-1000 shadow-2xl flex items-end justify-end p-2 ${getCornerBorderClass()}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${getCornerCrosshairClass()}`} />
                        <div className="w-[1px] h-6 bg-white/5 absolute right-6 bottom-0" />
                        <div className="h-[1px] w-6 bg-white/5 absolute bottom-6 right-0" />
                    </div>
                </div>
            </div>

            {/* PART 1: INTERVIEW MADE EASY (Hero Stage - Cyan Vibe) */}
            <section className="relative z-10 h-screen flex flex-col justify-center items-center px-6 text-center">
                <h1 className="intro-reveal opacity-0 max-w-5xl text-center leading-tight">
                    <span className="text-6xl md:text-9xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-appCyan">
                        Interview
                    </span>
                    <span 
                        style={{ fontFamily: "'Dancing Script', cursive" }} 
                        className="block text-5xl md:text-8xl mt-3 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse"
                    >
                        Made Easy
                    </span>
                </h1>
                <p className="intro-reveal opacity-0 mt-6 text-xl md:text-3xl font-extrabold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-md">
                    From Resume to Offer Letter — Simplified.
                </p>
                <p className="intro-reveal opacity-0 mt-4 text-xs md:text-sm text-slate-350 max-w-2xl font-medium leading-relaxed">
                    Stop guessing and start preparing with precision. Practice with our top-tier tools designed by placement experts: realistic conversational AI feedback, project portfolio defenses, and dynamic concept-focused quizzes.
                </p>

                {/* Features & Phase 1 Highlights */}
                <div className="intro-reveal opacity-0 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
                    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md text-left">
                        <span className="text-xl">🎙️</span>
                        <h4 className="text-xs font-bold mt-1 text-white">Vocal AI Arena</h4>
                        <p className="text-[9px] text-slate-400 mt-1">Simulated MNC interviews with real-time neural voice feedback.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md text-left">
                        <span className="text-xl">🧠</span>
                        <h4 className="text-xs font-bold mt-1 text-white">Adaptive Quizzes</h4>
                        <p className="text-[9px] text-slate-400 mt-1">Infinite customized tests that tune to your skill levels.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md text-left">
                        <span className="text-xl">📂</span>
                        <h4 className="text-xs font-bold mt-1 text-white">Resume Auditing</h4>
                        <p className="text-[9px] text-slate-400 mt-1">Randomized project defense, hobbies, and experience checks.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md text-left">
                        <span className="text-xl">👔</span>
                        <h4 className="text-xs font-bold mt-1 text-white">Etiquette Vault</h4>
                        <p className="text-[9px] text-slate-400 mt-1">HBS guides, STAR frameworks, and professional checklists.</p>
                    </div>
                </div>

                <button 
                    onClick={onNavigateToDashboard}
                    className="intro-reveal opacity-0 mt-8 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                >
                    Enter Control Center 🡢
                </button>
            </section>

            {/* PART 2: THE TRAINING GROUNDS (Theory Stage - Gold Vibe) */}
            <section className="relative z-10 h-screen flex flex-col justify-center px-10 md:px-24">
                <div className="max-w-3xl space-y-6">
                    <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest uppercase text-appGold bg-appGold/5 w-fit px-3 py-1.5 rounded-full border border-appGold/20">
                        <span>📊 Step 02 // Training Grounds</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white">
                        Master Core Knowledge
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                        <div className="p-5 border border-white/5 rounded-xl bg-slate-950/20 backdrop-blur-md">
                            <span className="text-appGold font-mono text-xs block mb-1">⚔️ RE-ENGINEER YOUR INTERVIEW POTENTIAL</span>
                            <p className="text-[11px] text-slate-500 leading-normal">Engage in highly realistic vocal sessions with Zephyr, our neural assessor, practicing technical defense under placement simulation pressures.</p>
                        </div>
                        <div className="p-5 border border-white/5 rounded-xl bg-slate-950/20 backdrop-blur-md">
                            <span className="text-appGold font-mono text-xs block mb-1">📖 COMPLETE STUDY VAULT</span>
                            <p className="text-[11px] text-slate-500 leading-normal">Access a complete guide to study from textbooks, cheatsheets, free resources, and integrated YouTube tutorial links.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PART 3: PORTFOLIO DEFENSE MATRIX (Resume Stage - Purple Vibe) */}
            <section className="relative z-10 h-screen flex flex-col justify-center items-end px-10 md:px-24">
                <div className="max-w-3xl space-y-6 text-right flex flex-col items-end">
                    <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest uppercase text-purple-400 bg-purple-500/5 w-fit px-3 py-1.5 rounded-full border border-purple-500/20">
                        <span>📄 Step 03 // Evaluation Arena</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white">
                        Test & Defend Your Skills
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                        <div className="p-5 border border-white/5 rounded-xl bg-slate-950/20 backdrop-blur-md">
                            <span className="text-purple-400 font-mono text-xs block mb-1">🧠 ADAPTIVE QUIZ ENGINE</span>
                            <p className="text-[11px] text-slate-500 leading-normal">Challenge your speed and conceptual depth with AI-generated quiz decks that dynamically adapt to your performance.</p>
                        </div>
                        <div className="p-5 border border-white/5 rounded-xl bg-slate-950/20 backdrop-blur-md">
                            <span className="text-purple-400 font-mono text-xs block mb-1">🎙️ RESUME-BASED SPECIFIC MOCK INTERVIEWS</span>
                            <p className="text-[11px] text-slate-500 leading-normal">Engage in customized mock sessions based on your own projects and profile stack, defending your engineering background in vocal rounds.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PART 4: THE CONVERGENCE GATEWAY (Console Reveal - Emerald Vibe) */}
            <section className="relative z-10 h-screen flex flex-col justify-center items-center px-6">
                <div 
                    ref={dashboardCtaRef}
                    className={`w-full max-w-xl transition-all duration-700 transform ${
                        currentVibe === 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
                    }`}
                >
                    <div className="p-8 md:p-10 bg-gradient-to-b from-[#101920] to-[#070a13] border border-emerald-500/30 rounded-3xl text-center space-y-6 shadow-2xl shadow-emerald-500/5 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(5,245,135,0.06),transparent_50%)] pointer-events-none" />

                        <div className="relative z-10 space-y-2">
                            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold animate-pulse">
                                🤝 Your Future is Calling
                            </span>
                            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                                Build Confidence. Claim Your Offer.
                            </h3>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            "Success is where preparation meets opportunity." Elevate your speaking style, clean up your code execution architecture, and walk into your next interview with complete poise.
                        </p>

                        <div className="p-4 rounded-xl border border-emerald-500/20 bg-black/50 text-left font-mono text-[10px] md:text-xs space-y-1.5 text-emerald-400">
                            <p className="flex items-center gap-2">
                                <span className="text-emerald-400">✔</span>
                                <span>AI Mock Interview Assessor: Online</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-emerald-400">✔</span>
                                <span>Adaptive Quiz Engines: Provisoned & Ready</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-emerald-400">✔</span>
                                <span>Academic Reference Blueprints: Available</span>
                            </p>
                        </div>

                        <button 
                            onClick={onNavigateToDashboard}
                            className="relative z-10 w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95 transition-all cursor-pointer animate-pulse"
                        >
                            Launch Assessment Console 🡢
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default HomePage;