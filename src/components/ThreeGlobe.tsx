import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ENSOPhase, Teleconnection } from '../types/enso';
import { TELECONNECTIONS } from '../data/ensoHistoricalData';
import { Globe, MapPin, Compass, RotateCcw, AlertTriangle } from 'lucide-react';

interface ThreeGlobeProps {
  phase: ENSOPhase;
  oniValue: number;
  selectedTeleconnection: Teleconnection | null;
  onSelectTeleconnection: (t: Teleconnection | null) => void;
}

export const ThreeGlobe: React.FC<ThreeGlobeProps> = ({
  phase,
  oniValue,
  selectedTeleconnection,
  onSelectTeleconnection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const sstaMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [hoveredPin, setHoveredPin] = useState<Teleconnection | null>(null);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.1, y: -2.3 }); // Default Pacific centered
  const autoRotate = useRef(false);

  // Helper to convert Lat/Lng to 3D Cartesian on Sphere of radius R
  const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060b14);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xdce7f5, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    sunLight.position.set(12, 10, 15);
    scene.add(sunLight);

    const backRim = new THREE.DirectionalLight(0x0088ff, 0.4);
    backRim.position.set(-15, -10, -15);
    scene.add(backRim);

    // 5. Globe Master Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const earthRadius = 6.2;

    // Procedural Earth Texture Generation on Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base Ocean: Rich oceanic navy blue
    ctx.fillStyle = '#0f243e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Ocean Bathymetry grid
    ctx.strokeStyle = 'rgba(30, 60, 95, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Equator Line Accent
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw Major Landmass Outlines & Continents
    // Helper to map lat/lng to canvas pixels
    const toCanvasX = (lng: number) => ((lng + 180) / 360) * canvas.width;
    const toCanvasY = (lat: number) => ((90 - lat) / 180) * canvas.height;

    ctx.fillStyle = '#1e332d'; // Dark slate continental green
    ctx.strokeStyle = '#2d4d44';
    ctx.lineWidth = 1.5;

    // North America approximate polygon
    ctx.beginPath();
    const na = [
      [-165, 65], [-140, 70], [-95, 70], [-60, 60], [-65, 45], [-75, 35],
      [-80, 25], [-90, 18], [-105, 20], [-118, 32], [-125, 48], [-140, 58], [-165, 65]
    ];
    na.forEach(([lng, lat], i) => {
      const x = toCanvasX(lng);
      const y = toCanvasY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // South America
    ctx.beginPath();
    const sa = [
      [-78, 10], [-55, 5], [-35, -5], [-38, -15], [-55, -30], [-65, -45],
      [-70, -55], [-75, -45], [-72, -30], [-80, -5], [-80, 5], [-78, 10]
    ];
    sa.forEach(([lng, lat], i) => {
      const x = toCanvasX(lng);
      const y = toCanvasY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eurasia
    ctx.beginPath();
    const ea = [
      [-10, 36], [10, 38], [25, 40], [35, 30], [55, 25], [70, 20], [80, 12],
      [90, 22], [105, 10], [120, 25], [125, 40], [140, 45], [142, 60], [165, 65],
      [100, 75], [40, 70], [10, 60], [-5, 50], [-10, 36]
    ];
    ea.forEach(([lng, lat], i) => {
      const x = toCanvasX(lng);
      const y = toCanvasY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Africa
    ctx.beginPath();
    const af = [
      [-15, 30], [10, 35], [32, 30], [45, 12], [50, 10], [40, -10],
      [30, -32], [20, -35], [12, -20], [8, 4], [-15, 12], [-15, 30]
    ];
    af.forEach(([lng, lat], i) => {
      const x = toCanvasX(lng);
      const y = toCanvasY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Australia
    ctx.beginPath();
    const au = [
      [115, -22], [130, -12], [142, -10], [150, -22], [152, -35],
      [138, -38], [118, -35], [113, -25], [115, -22]
    ];
    au.forEach(([lng, lat], i) => {
      const x = toCanvasX(lng);
      const y = toCanvasY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Maritime Continent / Indonesia Islands
    const islands = [
      [105, 0, 18, 7], // Sumatra
      [114, 0, 16, 12], // Borneo
      [120, -3, 10, 10], // Sulawesi
      [138, -4, 22, 10], // New Guinea
      [138, 36, 14, 6], // Japan
      [-156, 20, 8, 4], // Hawaii
    ];
    ctx.fillStyle = '#223d33';
    islands.forEach(([lng, lat, w, h]) => {
      ctx.beginPath();
      ctx.ellipse(toCanvasX(lng), toCanvasY(lat), (w / 360) * canvas.width, (h / 180) * canvas.height, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    const earthTexture = new THREE.CanvasTexture(canvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;

    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Dynamic Sea Surface Temperature Anomaly (SSTA) Layer
    // Overlay band hovering slightly above earth surface in the Equatorial Pacific (Niño 3.4 / 1+2 / 3 regions)
    const sstaGeo = new THREE.RingGeometry(0.1, 4.2, 48);
    // Custom equatorial anomaly mesh: a curved curved curved patch centered on Pacific
    const pacificPatchGeo = new THREE.SphereGeometry(earthRadius + 0.04, 64, 64, 0, Math.PI, Math.PI / 3, Math.PI / 3);
    const sstaMat = new THREE.MeshBasicMaterial({
      color: 0xff4422,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const sstaMesh = new THREE.Mesh(pacificPatchGeo, sstaMat);
    sstaMesh.rotation.y = -Math.PI / 2; // Center on Pacific
    globeGroup.add(sstaMesh);
    sstaMeshRef.current = sstaMesh;

    // Atmospheric Outer Glow Halo
    const atmosGeo = new THREE.SphereGeometry(earthRadius + 0.35, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.75 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.3, 0.7, 1.0, 1.0) * intensity * 0.75;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosphere);
    atmosphereRef.current = atmosphere;

    // 6. 3D Teleconnection Pins
    const pinsGroup = new THREE.Group();
    globeGroup.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    TELECONNECTIONS.forEach((item) => {
      const pinPos = latLngToVector3(item.lat, item.lng, earthRadius + 0.12);

      const pinAnchor = new THREE.Group();
      pinAnchor.position.copy(pinPos);
      pinAnchor.lookAt(new THREE.Vector3(0, 0, 0)); // Orient perpendicular to sphere

      // Pin head sphere
      const sphereGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Warm Amber
        emissive: 0xd97706,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.z = -0.4;
      pinAnchor.add(sphereMesh);

      // Pin stem
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.rotation.x = Math.PI / 2;
      stemMesh.position.z = -0.2;
      pinAnchor.add(stemMesh);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.28, 0.38, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      pinAnchor.add(ringMesh);

      // Attach data reference for raycasting
      sphereMesh.userData = { teleconnection: item };

      pinsGroup.add(pinAnchor);
    });

    // 7. Raycaster for clicking pins
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const checkPinHover = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      if (pinsGroupRef.current) {
        const pinMeshes: THREE.Object3D[] = [];
        pinsGroupRef.current.children.forEach((anchor) => {
          if (anchor.children[0]) pinMeshes.push(anchor.children[0]);
        });
        const intersects = raycaster.intersectObjects(pinMeshes);
        if (intersects.length > 0) {
          const tc = intersects[0].object.userData.teleconnection as Teleconnection;
          setHoveredPin(tc);
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredPin(null);
          renderer.domElement.style.cursor = isDragging.current ? 'grabbing' : 'grab';
        }
      }
    };

    const handlePinClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      if (pinsGroupRef.current) {
        const pinMeshes: THREE.Object3D[] = [];
        pinsGroupRef.current.children.forEach((anchor) => {
          if (anchor.children[0]) pinMeshes.push(anchor.children[0]);
        });
        const intersects = raycaster.intersectObjects(pinMeshes);
        if (intersects.length > 0) {
          const tc = intersects[0].object.userData.teleconnection as Teleconnection;
          onSelectTeleconnection(tc);
        }
      }
    };

    // Drag handlers
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      checkPinHover(e);
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;

      rotation.current.y += dx * 0.006;
      rotation.current.x = THREE.MathUtils.clamp(
        rotation.current.x + dy * 0.006,
        -Math.PI / 3,
        Math.PI / 3
      );

      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.015, 10, 30);
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouse.current.x;
      const dy = e.touches[0].clientY - prevMouse.current.y;
      rotation.current.y += dx * 0.006;
      rotation.current.x = THREE.MathUtils.clamp(rotation.current.x + dy * 0.006, -Math.PI / 3, Math.PI / 3);
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDragging.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', handlePinClick);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (autoRotate.current && !isDragging.current) {
        rotation.current.y += 0.002;
      }

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.x = rotation.current.x;
        globeGroupRef.current.rotation.y = rotation.current.y;
      }

      // Dynamic SSTA Anomaly Mesh Color & Opacity
      if (sstaMeshRef.current) {
        const mat = sstaMeshRef.current.material as THREE.MeshBasicMaterial;
        if (phase === 'el-nino') {
          mat.color.setHex(0xf43f5e); // Hot Coral Crimson
          mat.opacity = 0.45 + Math.sin(time * 3) * 0.1;
        } else if (phase === 'la-nina') {
          mat.color.setHex(0x06b6d4); // Vivid Cyan Blue
          mat.opacity = 0.45 + Math.sin(time * 3) * 0.1;
        } else {
          mat.color.setHex(0x10b981); // Emerald Neutral
          mat.opacity = 0.15;
        }
      }

      // Pulse pin rings
      if (pinsGroupRef.current) {
        pinsGroupRef.current.children.forEach((anchor, idx) => {
          const ring = anchor.children[2] as THREE.Mesh;
          if (ring) {
            const scale = 1 + (Math.sin(time * 4 + idx) + 1) * 0.2;
            ring.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', handlePinClick);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [phase]);

  // Center on region presets
  const lookAtRegion = (region: 'pacific' | 'americas' | 'indonesia') => {
    if (region === 'pacific') {
      rotation.current = { x: 0.05, y: -2.3 };
    } else if (region === 'americas') {
      rotation.current = { x: 0.15, y: -1.3 };
    } else if (region === 'indonesia') {
      rotation.current = { x: -0.05, y: 1.2 };
    }
  };

  return (
    <div id="three-globe-container" className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Overlay info */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Planetary View &amp; Teleconnections</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Click pulsing markers to inspect regional climate teleconnections.
          </p>
        </div>
      </div>

      {/* Top Right: Preset region jumps */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
        <button
          onClick={() => lookAtRegion('pacific')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Pacific Basin
        </button>
        <button
          onClick={() => lookAtRegion('americas')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Americas
        </button>
        <button
          onClick={() => lookAtRegion('indonesia')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Indo-Pacific
        </button>
      </div>

      {/* Hover Pin Tooltip preview */}
      {hoveredPin && !selectedTeleconnection && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-amber-500/40 shadow-xl max-w-sm text-center animate-fade-in">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 font-semibold text-xs mb-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{hoveredPin.region}</span>
          </div>
          <div className="text-[11px] text-slate-300">
            {phase === 'el-nino' ? hoveredPin.elNinoImpact.title : phase === 'la-nina' ? hoveredPin.laNinaImpact.title : 'Normal Climatological Conditions'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Click to view full teleconnection analysis</div>
        </div>
      )}

      {/* Selected Teleconnection Drawer / Card */}
      {selectedTeleconnection && (
        <div className="absolute top-4 right-4 bottom-4 w-80 z-30 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-2xl p-4 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Teleconnection Impact</span>
                <h3 className="text-base font-bold text-slate-100">{selectedTeleconnection.region}</h3>
              </div>
              <button
                onClick={() => onSelectTeleconnection(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Current Phase Impact */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    phase === 'el-nino'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : phase === 'la-nina'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  During {phase === 'el-nino' ? 'El Niño' : phase === 'la-nina' ? 'La Niña' : 'Neutral'}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white mb-1.5">
                {phase === 'el-nino'
                  ? selectedTeleconnection.elNinoImpact.title
                  : selectedTeleconnection.laNinaImpact.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {phase === 'el-nino'
                  ? selectedTeleconnection.elNinoImpact.details
                  : selectedTeleconnection.laNinaImpact.details}
              </p>

              {/* Key Hazards */}
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Primary Climate Hazards
                </span>
                <ul className="space-y-1">
                  {(phase === 'el-nino'
                    ? selectedTeleconnection.elNinoImpact.hazards
                    : selectedTeleconnection.laNinaImpact.hazards
                  ).map((hazard, idx) => (
                    <li key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{hazard}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Opposite Phase Comparison Preview */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                Opposite Phase Contrast ({phase === 'el-nino' ? 'La Niña' : 'El Niño'})
              </span>
              <p className="text-[11px] text-slate-300">
                {phase === 'el-nino'
                  ? selectedTeleconnection.laNinaImpact.title
                  : selectedTeleconnection.elNinoImpact.title}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTeleconnection(null)}
            className="w-full mt-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close Teleconnection Panel
          </button>
        </div>
      )}
    </div>
  );
};
