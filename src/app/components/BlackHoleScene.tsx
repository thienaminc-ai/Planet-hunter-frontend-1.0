
'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface BlackHoleSceneProps {
  width?: number;
  height?: number;
}

export default function BlackHoleScene({ width = 800, height = 600 }: BlackHoleSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Thiết lập cơ bản
    const WIDTH = width;
    const HEIGHT = height;
    const VIEW_ANGLE = 30;
    const ASPECT = WIDTH / HEIGHT;
    const NEAR = 1;
    const FAR = 10000;

    // Renderer, Scene, Camera
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.set(0, 800, 2500);
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = false;
    controls.enableDamping = true;

    // Dark space background
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);

    // Lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(20, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // Black Hole Group - Gargantua style with sphere and accretion disk
    const blackHole = new THREE.Group();
    
    // Central Black Hole Sphere (Event Horizon) - perfectly black
    const sphereGeometry = new THREE.SphereGeometry(300, 64, 64);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: false
    });
    const blackHoleSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    blackHoleSphere.position.set(0, 0, 0);
    blackHole.add(blackHoleSphere);

    // Accretion Disk (vòng xoáy tinh vân)
    const planeLoader = new THREE.TextureLoader();
    const planeTexture = planeLoader.load('https://s3-us-west-2.amazonaws.com/sabrinamarkon-images/images/blackhole7.png');
    const planeMaterial = new THREE.MeshPhongMaterial({ 
      map: planeTexture, 
      side: THREE.DoubleSide,
      emissive: 0xff6600,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.95
    });
    const accretionDisk = new THREE.Mesh(new THREE.PlaneGeometry(3500, 3500), planeMaterial);
    accretionDisk.rotation.set(-Math.PI / 2, 0, 0);
    accretionDisk.position.set(0, 0, 0);
    accretionDisk.receiveShadow = true;
    blackHole.add(accretionDisk);

    // Enhanced Star Fields with twinkling colors
    const createStarField = (config: { color: number; count: number; size: number; range: number }) => {
      const positions = new Float32Array(config.count * 3);
      const colors = new Float32Array(config.count * 3);
      const sizes = new Float32Array(config.count);
      
      for (let i = 0; i < config.count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * config.range;
        positions[i * 3 + 1] = (Math.random() - 0.5) * config.range;
        positions[i * 3 + 2] = (Math.random() - 0.5) * config.range;
        
        // Random color variations - white, blue, yellow, orange, red tints
        const colorVariations = [
          new THREE.Color(0xffffff), // white
          new THREE.Color(0xaaccff), // blue-white
          new THREE.Color(0xffffcc), // yellow-white
          new THREE.Color(0xffccaa), // orange-white
          new THREE.Color(0xffaaaa), // red-white
          new THREE.Color(0xccffff), // cyan-white
        ];
        const randomColor = colorVariations[Math.floor(Math.random() * colorVariations.length)];
        const brightness = 0.6 + Math.random() * 0.4;
        
        colors[i * 3] = randomColor.r * brightness;
        colors[i * 3 + 1] = randomColor.g * brightness;
        colors[i * 3 + 2] = randomColor.b * brightness;
        
        // Varied sizes for more natural look
        sizes[i] = config.size * (0.5 + Math.random() * 1.5);
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const material = new THREE.PointsMaterial({ 
        size: config.size,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      });
      
      const points = new THREE.Points(geometry, material);
      (points as unknown as { originalColors: Float32Array; twinklePhase: number }).originalColors = colors.slice();
      (points as unknown as { originalColors: Float32Array; twinklePhase: number }).twinklePhase = Math.random() * Math.PI * 2;
      
      return points;
    };

    // Multiple star layers for depth with varied colors
    const starField1 = createStarField({ color: 0xffffff, count: 3000, size: 2.5, range: 5000 });
    const starField2 = createStarField({ color: 0xffffaa, count: 2000, size: 1.8, range: 4000 });
    const starField3 = createStarField({ color: 0xaaaaff, count: 1500, size: 1.2, range: 3500 });
    const starField4 = createStarField({ color: 0xffaa88, count: 1000, size: 3, range: 6000 });
    
    scene.add(starField1);
    scene.add(starField2);
    scene.add(starField3);
    scene.add(starField4);

    // Space Junk - scaled up to match Gargantua
    const parametricFunction = (u: number, v: number, target: THREE.Vector3) => {
      const x = -50 + 200 * u;
      const y = (Math.sin(u * Math.PI) + Math.sin(v * Math.PI)) * -20 + 200;
      const z = -50 + 200 * v;
      target.set(x, y, z);
    };
    
    const segments = 64;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const u = i / segments;
        const v = j / segments;
        const point = new THREE.Vector3();
        parametricFunction(u, v, point);
        positions.push(point.x, point.y, point.z);
        uvs.push(u, v);
      }
    }
    
    const indices = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const parametricGeometry = geometry;
    const spaceJunkLoader = new THREE.TextureLoader();
    const spaceJunkTexture = spaceJunkLoader.load('https://s3-us-west-2.amazonaws.com/sabrinamarkon-images/images/spacejunk1.jpg');
    const paraMaterial = new THREE.MeshPhongMaterial({
      map: spaceJunkTexture,
      side: THREE.DoubleSide,
      specular: 0xffffff,
      shininess: 5
    });
    const spaceJunk = new THREE.Mesh(parametricGeometry, paraMaterial);
    spaceJunk.position.set(400, 150, 600);
    spaceJunk.scale.set(3, 3, 3);
    spaceJunk.castShadow = true;
    blackHole.add(spaceJunk);

    const coneGeometry = new THREE.CylinderGeometry(0, 80, 200, 200, 80, false);
    const spaceJunkTexture2 = spaceJunkLoader.load('https://s3-us-west-2.amazonaws.com/sabrinamarkon-images/images/spacejunk2.jpg');
    const coneMaterial = new THREE.MeshPhongMaterial({
      map: spaceJunkTexture2,
      side: THREE.DoubleSide,
      specular: 0xffffff,
      shininess: 5
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(400, 150, 600);
    cone.scale.set(2, 2, 2);
    blackHole.add(cone);

    scene.add(blackHole);

    // Refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Animate star fields and black hole components
      starField1.rotation.y += 0.0002;
      starField1.rotation.x += 0.0001;
      
      starField2.rotation.y -= 0.0003;
      starField2.rotation.z += 0.0001;
      
      starField3.rotation.y += 0.0004;
      starField3.rotation.x -= 0.0002;
      
      starField4.rotation.y -= 0.0001;
      starField4.rotation.z -= 0.0001;
      
      // Rotate accretion disk (vòng xoáy)
      accretionDisk.rotation.z += 0.0008;
      
      spaceJunk.rotation.x -= 0.003;
      cone.rotation.x -= 0.005;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (currentMount && camera && renderer) {
        const newWidth = currentMount.clientWidth;
        const newHeight = currentMount.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && currentMount) {
        currentMount.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      controlsRef.current?.dispose();
      sceneRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
    };
  }, [width, height]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} className="w-full h-full" />;
}