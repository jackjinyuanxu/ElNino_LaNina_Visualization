import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ENSOPhase } from '../types/enso';
import { Eye, RotateCcw, Layers, Compass, Wind, Thermometer, CloudRain, Droplets } from 'lucide-react';

interface ThreePacificBasinProps {
  phase: ENSOPhase;
  oniValue: number; // e.g. -2.5 to +2.5
  tradeWindStrength: number; // -100 to +200
  thermoclineTilt: number; // 0 to 100
  showWalkerCell?: boolean;
  showThermocline?: boolean;
  showUpwellingVectors?: boolean;
  showWindVectors?: boolean;
  showCloudConvection?: boolean;
  showDepthLabels?: boolean;
  onSelectRegion?: (region: string) => void;
}

export const ThreePacificBasin: React.FC<ThreePacificBasinProps> = ({
  phase,
  oniValue,
  tradeWindStrength,
  thermoclineTilt,
  showWalkerCell = true,
  showThermocline = true,
  showUpwellingVectors = true,
  showWindVectors = true,
  showCloudConvection = true,
  showDepthLabels = true,
  onSelectRegion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Dynamic mesh refs for smooth continuous interpolation
  const thermoclineMeshRef = useRef<THREE.Mesh | null>(null);
  const surfaceMeshRef = useRef<THREE.Mesh | null>(null);
  const upwellingParticlesRef = useRef<THREE.Points | null>(null);
  const windParticlesRef = useRef<THREE.Points | null>(null);
  const walkerLoopGroupRef = useRef<THREE.Group | null>(null);
  const cloudGroupRef = useRef<THREE.Group | null>(null);
  const rainGroupRef = useRef<THREE.Points | null>(null);

  // Interaction controls
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraOrbit = useRef({ theta: 0.35, phi: 0.65, radius: 28 });
  const [cameraView, setCameraView] = useState<'iso' | 'profile' | 'top' | 'atmosphere'>('iso');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Update camera view position
  const setPresetView = (view: 'iso' | 'profile' | 'top' | 'atmosphere') => {
    setCameraView(view);
    if (view === 'iso') {
      cameraOrbit.current = { theta: 0.38, phi: 0.62, radius: 28 };
    } else if (view === 'profile') {
      cameraOrbit.current = { theta: 0, phi: 1.45, radius: 27 };
    } else if (view === 'top') {
      cameraOrbit.current = { theta: 0, phi: 0.08, radius: 29 };
    } else if (view === 'atmosphere') {
      cameraOrbit.current = { theta: 0.2, phi: 0.95, radius: 25 };
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1120); // Deep oceanic dark slate
    scene.fog = new THREE.FogExp2(0x0a1120, 0.018);

    // 2. Camera Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear previous
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xd0e0f5, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const oceanGlow = new THREE.DirectionalLight(0x0099ff, 0.6);
    oceanGlow.position.set(-10, -10, -10);
    scene.add(oceanGlow);

    // 5. Construct Pacific Basin Cutaway Geometry
    // Basin Dimensions: X = -12 (West, 120°E Indonesia) to +12 (East, 80°W South America)
    // Width (Latitude): Z = -5 (10°N) to +5 (10°S)
    // Depth: Y = -6 (300m depth) to 0 (Sea Surface)
    const basinGroup = new THREE.Group();
    scene.add(basinGroup);

    // Deep Abyssal Base (-6m depth floor)
    const floorGeo = new THREE.PlaneGeometry(24, 10);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050c18,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -6;
    basinGroup.add(floorMesh);

    // Ocean Surface Mesh (Y = 0) with high subdivision for dynamic vertex colors
    const surfaceSegX = 64;
    const surfaceSegZ = 24;
    const surfaceGeo = new THREE.PlaneGeometry(24, 10, surfaceSegX, surfaceSegZ);
    // Add vertex colors attribute
    const surfaceCount = surfaceGeo.attributes.position.count;
    const surfaceColors = new Float32Array(surfaceCount * 3);
    surfaceGeo.setAttribute('color', new THREE.BufferAttribute(surfaceColors, 3));

    const surfaceMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.rotation.x = -Math.PI / 2;
    surfaceMesh.position.y = 0;
    basinGroup.add(surfaceMesh);
    surfaceMeshRef.current = surfaceMesh;

    // Dynamic Thermocline Boundary Surface
    const thermoGeo = new THREE.PlaneGeometry(24, 10, 48, 16);
    const thermoCount = thermoGeo.attributes.position.count;
    const thermoColors = new Float32Array(thermoCount * 3);
    thermoGeo.setAttribute('color', new THREE.BufferAttribute(thermoColors, 3));

    const thermoMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.3,
      metalness: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const thermoclineMesh = new THREE.Mesh(thermoGeo, thermoMat);
    thermoclineMesh.rotation.x = -Math.PI / 2;
    basinGroup.add(thermoclineMesh);
    thermoclineMeshRef.current = thermoclineMesh;

    // Glass / Cutaway Basin Walls
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a2244,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.5,
      side: THREE.DoubleSide,
    });

    // South wall (front cutaway at Z = +5)
    const frontWallGeo = new THREE.PlaneGeometry(24, 6);
    const frontWall = new THREE.Mesh(frontWallGeo, wallMat);
    frontWall.position.set(0, -3, 5);
    basinGroup.add(frontWall);

    // North wall (back at Z = -5)
    const backWall = new THREE.Mesh(frontWallGeo, wallMat);
    backWall.position.set(0, -3, -5);
    basinGroup.add(backWall);

    // West Coastline Landform (Indonesia / Australia / Maritime Continent)
    const westLandGeo = new THREE.BoxGeometry(3, 8, 10);
    const westLandMat = new THREE.MeshStandardMaterial({
      color: 0x1f382a, // Lush tropical green / topography
      roughness: 0.8,
    });
    const westLand = new THREE.Mesh(westLandGeo, westLandMat);
    westLand.position.set(-13.5, -2, 0);
    basinGroup.add(westLand);

    // East Coastline Landform (South America / Andes / Peru Coast)
    const eastLandGeo = new THREE.BoxGeometry(3, 8, 10);
    const eastLandMat = new THREE.MeshStandardMaterial({
      color: 0x5a483a, // Arid coastal desert / Andes range
      roughness: 0.85,
    });
    const eastLand = new THREE.Mesh(eastLandGeo, eastLandMat);
    eastLand.position.set(13.5, -2, 0);
    basinGroup.add(eastLand);

    // Andes Mountains Ridge accent
    const andesRidgeGeo = new THREE.ConeGeometry(1.2, 3, 4);
    const andesMat = new THREE.MeshStandardMaterial({ color: 0x7a6a5d, roughness: 0.9 });
    const andes1 = new THREE.Mesh(andesRidgeGeo, andesMat);
    andes1.position.set(13.5, 3.2, -1.5);
    andes1.rotation.y = Math.PI / 4;
    basinGroup.add(andes1);
    const andes2 = new THREE.Mesh(andesRidgeGeo, andesMat);
    andes2.position.set(13.8, 3.5, 1.8);
    basinGroup.add(andes2);

    // Grid wireframe reference lines for depth scale
    const depthLinesGeo = new THREE.BufferGeometry();
    const depthPoints: number[] = [];
    // Depth markers at 0m, -100m (Y=-2), -200m (Y=-4), -300m (Y=-6)
    [-2, -4, -6].forEach((y) => {
      // Front cutaway horizontal line
      depthPoints.push(-12, y, 5, 12, y, 5);
      // East vertical edge
      depthPoints.push(12, y, 5, 12, y, -5);
    });
    depthLinesGeo.setAttribute('position', new THREE.Float32BufferAttribute(depthPoints, 3));
    const depthLineMat = new THREE.LineBasicMaterial({ color: 0x336699, transparent: true, opacity: 0.4 });
    const depthLines = new THREE.LineSegments(depthLinesGeo, depthLineMat);
    basinGroup.add(depthLines);

    // 6. Upwelling Streamlines / Particle System (Eastern Pacific off Peru)
    const upwellCount = 180;
    const upwellPositions = new Float32Array(upwellCount * 3);
    const upwellSpeeds = new Float32Array(upwellCount);
    for (let i = 0; i < upwellCount; i++) {
      upwellPositions[i * 3 + 0] = 9.0 + (Math.random() - 0.5) * 4.5; // X: East side
      upwellPositions[i * 3 + 1] = -5.8 + Math.random() * 5.5; // Y: from depth to near surface
      upwellPositions[i * 3 + 2] = (Math.random() - 0.5) * 7.5; // Z: Equator band
      upwellSpeeds[i] = 0.02 + Math.random() * 0.04;
    }
    const upwellGeo = new THREE.BufferGeometry();
    upwellGeo.setAttribute('position', new THREE.BufferAttribute(upwellPositions, 3));
    const upwellMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.28,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const upwellParticles = new THREE.Points(upwellGeo, upwellMat);
    basinGroup.add(upwellParticles);
    upwellingParticlesRef.current = upwellParticles;

    // 7. Surface Trade Wind Particle System (Y = 0.8)
    const windCount = 350;
    const windPositions = new Float32Array(windCount * 3);
    const windInitialOffsets = new Float32Array(windCount);
    for (let i = 0; i < windCount; i++) {
      windPositions[i * 3 + 0] = -12 + Math.random() * 24; // X: spans basin
      windPositions[i * 3 + 1] = 0.35 + Math.random() * 1.2; // Y: low atmosphere
      windPositions[i * 3 + 2] = (Math.random() - 0.5) * 8.5; // Z: tropical band
      windInitialOffsets[i] = 0.03 + Math.random() * 0.05;
    }
    const windGeo = new THREE.BufferGeometry();
    windGeo.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    const windMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
    });
    const windParticles = new THREE.Points(windGeo, windMat);
    basinGroup.add(windParticles);
    windParticlesRef.current = windParticles;

    // 8. Walker Circulation Loop 3D Vector Curve
    const walkerGroup = new THREE.Group();
    basinGroup.add(walkerGroup);
    walkerLoopGroupRef.current = walkerGroup;

    // 9. Atmospheric Convective Clouds & Rain
    const cloudGroup = new THREE.Group();
    basinGroup.add(cloudGroup);
    cloudGroupRef.current = cloudGroup;

    // Build Puffy Cloud Cluster
    const cloudSphereGeo = new THREE.DodecahedronGeometry(0.8, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    });
    for (let i = 0; i < 9; i++) {
      const puff = new THREE.Mesh(cloudSphereGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 2.5,
        4.2 + (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 2.2
      );
      const scale = 0.7 + Math.random() * 0.6;
      puff.scale.set(scale, scale * 0.8, scale);
      cloudGroup.add(puff);
    }

    // Rain particles falling from cloud
    const rainCount = 140;
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3 + 0] = (Math.random() - 0.5) * 3;
      rainPos[i * 3 + 1] = 0.5 + Math.random() * 3.5;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.14,
      transparent: true,
      opacity: 0.65,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    cloudGroup.add(rainParticles);
    rainGroupRef.current = rainParticles;

    // Render loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Camera Spherical positioning
      const { theta, phi, radius } = cameraOrbit.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, -1.5, 0);

      // --- 1. Dynamic Thermocline & SST Updates ---
      // Normalize ONI: range ~ -2.5 (La Niña) to +2.5 (El Niño)
      // Normal: ONI ~ 0
      // Normal West: depth ~ -3.6 (180m), East: depth ~ -1.1 (55m)
      // El Niño: West ~ -2.4 (120m), East ~ -2.6 (130m) -> Flat!
      // La Niña: West ~ -4.6 (230m), East ~ -0.4 (20m) -> Super steep!
      const tiltFactor = (thermoclineTilt - 50) / 50; // -1 to +1
      const effectiveONI = THREE.MathUtils.clamp(oniValue, -2.5, 2.5);

      if (thermoclineMeshRef.current && showThermocline) {
        thermoclineMeshRef.current.visible = true;
        const geo = thermoclineMeshRef.current.geometry as THREE.PlaneGeometry;
        const pos = geo.attributes.position;
        const cols = geo.attributes.color;

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i); // -12 (West) to +12 (East)
          const z = pos.getY(i); // Local plane Y is global Z

          // Normalized x: 0 (West) to 1 (East)
          const normX = (x + 12) / 24;

          // Thermocline depth calculation
          // Base curve
          let westDepth = -3.5 - 1.2 * (tiltFactor > 0 ? tiltFactor : 0) + 0.9 * (effectiveONI > 0 ? effectiveONI / 2.5 : 0);
          let eastDepth = -1.1 + 1.6 * (effectiveONI > 0 ? effectiveONI / 2.5 : 0) + 0.8 * (tiltFactor < 0 ? -tiltFactor : 0);
          if (effectiveONI < -0.5) {
            // La Niña: East shoals close to surface
            eastDepth = -0.4;
            westDepth = -4.6;
          }

          // Subtle Kelvin wave undulating motion
          const wave = Math.sin(elapsedTime * 2.0 + x * 0.4) * 0.12 * (1 - Math.abs(x) / 14);

          // Quadratic interpolation across basin
          const depth = westDepth * (1 - normX) + eastDepth * normX + wave;
          pos.setZ(i, depth); // Local plane Z becomes global Y after rotation

          // Color thermocline: West warm golden-yellow to East deep oceanic blue
          // In El Niño: warm orange spreads east
          const r = THREE.MathUtils.lerp(0.9, 0.1, normX * (1 - Math.max(0, effectiveONI / 3)));
          const g = THREE.MathUtils.lerp(0.5, 0.4, normX);
          const b = THREE.MathUtils.lerp(0.2, 0.95, normX * (1 - Math.max(0, effectiveONI / 3)));
          cols.setXYZ(i, r, g, b);
        }
        pos.needsUpdate = true;
        cols.needsUpdate = true;
      } else if (thermoclineMeshRef.current) {
        thermoclineMeshRef.current.visible = false;
      }

      // --- 2. Sea Surface Temperature Colors ---
      if (surfaceMeshRef.current) {
        const geo = surfaceMeshRef.current.geometry as THREE.PlaneGeometry;
        const cols = geo.attributes.color;
        const pos = geo.attributes.position;

        for (let i = 0; i < cols.count; i++) {
          const x = pos.getX(i);
          const normX = (x + 12) / 24; // 0=West, 1=East

          // Dynamic SST color gradient based on phase & ONI
          // Warm Pool: ~29-30°C (Crimson/Coral), Cold Tongue: ~20-22°C (Cyan/Blue)
          let warmth = 0;
          if (effectiveONI >= 0.5) {
            // El Niño: Warm water spreads eastward
            const elNinoSpread = effectiveONI / 2.5; // 0.2 to 1.0
            warmth = Math.max(0, 1 - normX * (1 - elNinoSpread * 0.75));
          } else if (effectiveONI <= -0.5) {
            // La Niña: Cold tongue penetrates deep westward
            const laNinaIntense = Math.abs(effectiveONI) / 2.5;
            warmth = Math.max(0, Math.min(1, (1 - normX * 1.6) * (1 - laNinaIntense * 0.3)));
          } else {
            // Neutral: Standard warm west, cool east
            warmth = Math.max(0, Math.min(1, 1 - Math.pow(normX, 0.8) * 1.15));
          }

          // Thermal Color mapping:
          // warmth = 1 -> Red-Orange (0.95, 0.25, 0.15) [~30°C]
          // warmth = 0.5 -> Gold-Amber (0.9, 0.65, 0.2) [~26°C]
          // warmth = 0 -> Deep Turquoise / Cyan-Blue (0.05, 0.45, 0.75) [~20°C]
          let r = 0, g = 0, b = 0;
          if (warmth > 0.5) {
            const t = (warmth - 0.5) * 2;
            r = THREE.MathUtils.lerp(0.85, 0.98, t);
            g = THREE.MathUtils.lerp(0.65, 0.25, t);
            b = THREE.MathUtils.lerp(0.18, 0.12, t);
          } else {
            const t = warmth * 2;
            r = THREE.MathUtils.lerp(0.06, 0.85, t);
            g = THREE.MathUtils.lerp(0.48, 0.65, t);
            b = THREE.MathUtils.lerp(0.82, 0.18, t);
          }

          cols.setXYZ(i, r, g, b);
        }
        cols.needsUpdate = true;
      }

      // --- 3. Upwelling Particles (East Pacific Coast) ---
      if (upwellingParticlesRef.current && showUpwellingVectors) {
        upwellingParticlesRef.current.visible = true;
        const positions = upwellingParticlesRef.current.geometry.attributes.position;
        // In El Niño, upwelling is suppressed or negligible
        // In La Niña, upwelling is vigorous
        const upwellFactor = effectiveONI > 0.5 ? Math.max(0.05, 1 - effectiveONI / 2.0) : (effectiveONI < -0.5 ? 1.8 : 1.0);

        for (let i = 0; i < upwellCount; i++) {
          let y = positions.getY(i);
          y += upwellSpeeds[i] * upwellFactor;
          if (y > -0.2) {
            y = -5.8; // recycle to bottom
          }
          positions.setY(i, y);
        }
        positions.needsUpdate = true;
      } else if (upwellingParticlesRef.current) {
        upwellingParticlesRef.current.visible = false;
      }

      // --- 4. Wind Particles (Easterlies / Westerly Wind Bursts) ---
      if (windParticlesRef.current && showWindVectors) {
        windParticlesRef.current.visible = true;
        const positions = windParticlesRef.current.geometry.attributes.position;
        // Trade winds normally blow East -> West (-X direction)
        // Reversed in El Niño (+X direction)
        const windDir = tradeWindStrength < 0 ? 1 : -1;
        const speed = Math.abs(tradeWindStrength) / 600 + 0.02;

        for (let i = 0; i < windCount; i++) {
          let x = positions.getX(i);
          x += speed * windDir;
          if (x < -12) x = 12;
          if (x > 12) x = -12;
          positions.setX(i, x);
        }
        positions.needsUpdate = true;
      } else if (windParticlesRef.current) {
        windParticlesRef.current.visible = false;
      }

      // --- 5. Atmospheric Cloud & Rain Positioning ---
      if (cloudGroupRef.current && showCloudConvection) {
        cloudGroupRef.current.visible = true;
        // In Neutral: Convection sits over West Pacific (X ~ -8 to -9)
        // In El Niño: Convection shifts East into Central/East Pacific (X ~ +2 to +5)
        // In La Niña: Convection concentrated far West (X ~ -10 to -11)
        let targetCloudX = -8.5;
        if (effectiveONI >= 0.5) {
          targetCloudX = THREE.MathUtils.lerp(-8.5, 3.5, Math.min(1, effectiveONI / 2.2));
        } else if (effectiveONI <= -0.5) {
          targetCloudX = -10.5;
        }

        // Smooth transition
        cloudGroupRef.current.position.x = THREE.MathUtils.lerp(
          cloudGroupRef.current.position.x,
          targetCloudX,
          0.05
        );

        // Animate falling rain
        if (rainGroupRef.current) {
          const rainPositions = rainGroupRef.current.geometry.attributes.position;
          for (let i = 0; i < rainCount; i++) {
            let ry = rainPositions.getY(i);
            ry -= 0.12;
            if (ry < 0.2) ry = 4.0;
            rainPositions.setY(i, ry);
          }
          rainPositions.needsUpdate = true;
        }
      } else if (cloudGroupRef.current) {
        cloudGroupRef.current.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Mouse Drag & Orbit Event Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      cameraOrbit.current.theta -= deltaX * 0.007;
      cameraOrbit.current.phi = THREE.MathUtils.clamp(
        cameraOrbit.current.phi - deltaY * 0.007,
        0.05,
        Math.PI / 2 - 0.05
      );

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraOrbit.current.radius = THREE.MathUtils.clamp(
        cameraOrbit.current.radius + e.deltaY * 0.025,
        14,
        45
      );
    };

    // Touch Support for mobile / touchpads
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

      cameraOrbit.current.theta -= deltaX * 0.007;
      cameraOrbit.current.phi = THREE.MathUtils.clamp(
        cameraOrbit.current.phi - deltaY * 0.007,
        0.05,
        Math.PI / 2 - 0.05
      );

      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // Window Resize handling
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
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div id="three-basin-container" className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Phase & Active Parameter Status Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/60 shadow-lg max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                phase === 'el-nino'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                  : phase === 'la-nina'
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active State
            </span>
            <span
              className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${
                phase === 'el-nino'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : phase === 'la-nina'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {phase === 'el-nino' ? 'El Niño' : phase === 'la-nina' ? 'La Niña' : 'Neutral'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300 font-mono mt-1.5 pt-1.5 border-t border-slate-800">
            <div>
              <span className="text-slate-500">ONI Anomaly:</span>{' '}
              <span className={oniValue > 0 ? 'text-rose-400' : oniValue < 0 ? 'text-cyan-400' : 'text-slate-300'}>
                {oniValue >= 0 ? `+${oniValue.toFixed(2)}` : oniValue.toFixed(2)}°C
              </span>
            </div>
            <div>
              <span className="text-slate-500">Trade Winds:</span>{' '}
              <span className="text-slate-200">{tradeWindStrength}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Right: Camera Angle Presets */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
        <button
          id="btn-cam-iso"
          onClick={() => setPresetView('iso')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
            cameraView === 'iso' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Isometric View"
        >
          Isometric
        </button>
        <button
          id="btn-cam-profile"
          onClick={() => setPresetView('profile')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
            cameraView === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Side Profile / Cutaway"
        >
          Cutaway
        </button>
        <button
          id="btn-cam-top"
          onClick={() => setPresetView('top')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
            cameraView === 'top' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Top Down SST Map"
        >
          Surface
        </button>
        <button
          id="btn-cam-atmosphere"
          onClick={() => setPresetView('atmosphere')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
            cameraView === 'atmosphere' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Walker Circulation Atmosphere"
        >
          Atmosphere
        </button>
      </div>

      {/* Top Center: Wind Direction & Velocity Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg ${
            phase === 'el-nino'
              ? 'bg-rose-950/80 border-rose-600/50 text-rose-200'
              : phase === 'la-nina'
              ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
              : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200'
          }`}
        >
          <Wind className="w-4 h-4 shrink-0" />
          <span>
            {phase === 'el-nino'
              ? '⚠️ Trade Winds Stalled / Weakened → Warm Water Sloshing East'
              : phase === 'la-nina'
              ? '💨 Supercharged Trade Winds Blowing West (Overdrive)'
              : '💨 Normal Trade Winds: Blowing East-to-West Across the Pacific'}
          </span>
        </div>
      </div>

      {/* Prominent Left Label: West Pacific (Indonesia / Asia) */}
      <div className="absolute bottom-16 left-4 z-10 pointer-events-none max-w-[210px]">
        <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-emerald-500/40 shadow-lg text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <span>🌴</span>
            <span>WEST PACIFIC</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-200">
            Indonesia, Asia &amp; Australia
          </div>
          <div className="text-[10px] text-slate-400 mt-1 leading-tight">
            {phase === 'el-nino'
              ? 'Drought risk! Warm water has sloshed away to the east.'
              : phase === 'la-nina'
              ? 'Extreme warm pool (~30.5°C) & severe torrential monsoons.'
              : 'Warm pool (~30°C) piled up here. Normal tropical rainfall.'}
          </div>
        </div>
      </div>

      {/* Prominent Right Label: East Pacific (South America / Peru) */}
      <div className="absolute bottom-16 right-4 z-10 pointer-events-none max-w-[210px]">
        <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-amber-500/40 shadow-lg text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-amber-400">
            <span>EAST PACIFIC</span>
            <span>🏔️</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-200">
            South America (Peru &amp; Ecuador)
          </div>
          <div className="text-[10px] text-slate-400 mt-1 leading-tight">
            {phase === 'el-nino'
              ? 'Heavy storms & coastal flooding! Warm water blankets the coast.'
              : phase === 'la-nina'
              ? 'Intense cold upwelling (~19°C) & very dry desert conditions.'
              : 'Cold tongue (~22°C) with active nutrient-rich upwelling.'}
          </div>
        </div>
      </div>

      {/* Bottom Center: Spatial Scale & Coordinates Legend */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 sm:gap-6 px-4 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-emerald-400">West:</span>
          <span>Asia / Indonesia</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span>← Pacific Ocean →</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="font-semibold text-amber-400">East:</span>
          <span>South America</span>
        </div>
      </div>

      {/* Bottom Right: Temperature Color Scale Legend */}
      <div className="absolute bottom-4 right-4 z-10 hidden md:flex flex-col gap-1 px-3 py-2 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-800 text-[10px] text-slate-400">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-semibold text-slate-300 mb-0.5">
          <span>Sea Surface Temp</span>
          <span>°C</span>
        </div>
        <div className="w-28 h-2 rounded-full bg-gradient-to-r from-blue-600 via-amber-400 to-rose-600 shadow-inner" />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>20°C</span>
          <span>25°C</span>
          <span>30°C</span>
        </div>
      </div>

      {/* Depth & Oceanic Markers (Visual indicators on screen) */}
      {showDepthLabels && (
        <div className="absolute top-20 left-4 z-10 flex flex-col gap-1 text-[10px] font-mono text-slate-500 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>0m Surface Warm Mixed Layer</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>~150m Thermocline Boundary</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>300m Abyssal Deep Ocean (2-4°C)</span>
          </div>
        </div>
      )}
    </div>
  );
};
