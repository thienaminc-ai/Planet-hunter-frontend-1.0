'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface BlackHoleSceneProps {
  width?: number;
  height?: number;
}

interface StarFieldData {
  originalColors: Float32Array;
  twinklePhase: number;
}

export default function BlackHoleScene({ width = 800, height = 600 }: BlackHoleSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

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
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const clock = new THREE.Clock();
    const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.set(350, 250, 1200);
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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(20, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // Black Hole Group
    const blackHole = new THREE.Group();

    // Central Black Sphere (Tâm hố đen - khối cầu đen đặc)
    const blackSphereGeometry = new THREE.SphereGeometry(50, 64, 64);
    const blackSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackSphere = new THREE.Mesh(blackSphereGeometry, blackSphereMaterial);
    blackSphere.position.set(0, 0, 0);
    blackHole.add(blackSphere);

    // Black Hole Plane - Đĩa tinh vân với texture gốc, mở rộng và nhạt hơn
    const planeLoader = new THREE.TextureLoader();
    const planeTexture = planeLoader.load('https://s3-us-west-2.amazonaws.com/sabrinamarkon-images/images/blackhole7.png');
    const planeMaterial = new THREE.MeshPhongMaterial({ 
      map: planeTexture, 
      side: THREE.DoubleSide,
      emissive: 0x333333, // Màu xám nhạt để ánh sáng tự nhiên từ texture
      emissiveIntensity: 0.2, // Giảm độ sáng để nhạt hơn
      transparent: true,
      opacity: 0.5, // Nhạt hơn để trông thực tế
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 3000), planeMaterial);
    plane.rotation.set(-Math.PI / 2, 0, 0);
    plane.position.set(0, 0, 0);
    plane.receiveShadow = true;
    blackHole.add(plane);

    // Enhanced Star Fields with twinkling colors
    const createStarField = (config: { color: number; count: number; size: number; range: number }) => {
      const positions = new Float32Array(config.count * 3);
      const colors = new Float32Array(config.count * 3);
      const sizes = new Float32Array(config.count);
      
      for (let i = 0; i < config.count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * config.range;
        positions[i * 3 + 1] = (Math.random() - 0.5) * config.range;
        positions[i * 3 + 2] = (Math.random() - 0.5) * config.range;
        
        const colorVariations = [
          new THREE.Color(0xffffff),
          new THREE.Color(0xaaccff),
          new THREE.Color(0xffffcc),
          new THREE.Color(0xffccaa),
          new THREE.Color(0xffaaaa),
          new THREE.Color(0xccffff),
        ];
        const randomColor = colorVariations[Math.floor(Math.random() * colorVariations.length)];
        const brightness = 0.6 + Math.random() * 0.4;
        
        colors[i * 3] = randomColor.r * brightness;
        colors[i * 3 + 1] = randomColor.g * brightness;
        colors[i * 3 + 2] = randomColor.b * brightness;
        
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
      
      // Store custom properties for animation
      const starData: StarFieldData = {
        originalColors: colors.slice(),
        twinklePhase: Math.random() * Math.PI * 2
      };
      Object.assign(points, starData);
      
      return points;
    };

    const starField1 = createStarField({ color: 0xffffff, count: 3000, size: 2.5, range: 5000 });
    const starField2 = createStarField({ color: 0xffffaa, count: 2000, size: 1.8, range: 4000 });
    const starField3 = createStarField({ color: 0xaaaaff, count: 1500, size: 1.2, range: 3500 });
    const starField4 = createStarField({ color: 0xffaa88, count: 1000, size: 3, range: 6000 });
    
    scene.add(starField1);
    scene.add(starField2);
    scene.add(starField3);
    scene.add(starField4);

    // Space Junk - Giữ nguyên từ phiên bản cũ
    const parametricFunction = (u: number, v: number, target: THREE.Vector3) => {
      const x = -5 + 70 * u;
      const y = (Math.sin(u * Math.PI) + Math.sin(v * Math.PI)) * -7 + 90;
      const z = -5 + 70 * v;
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
    spaceJunk.position.set(150, 50, 200);
    spaceJunk.scale.set(2.5, 2.5, 2.5);
    spaceJunk.castShadow = true;
    blackHole.add(spaceJunk);

    const coneGeometry = new THREE.CylinderGeometry(0, 60, 140, 200, 80, false);
    const spaceJunkTexture2 = spaceJunkLoader.load('https://s3-us-west-2.amazonaws.com/sabrinamarkon-images/images/spacejunk2.jpg');
    const coneMaterial = new THREE.MeshPhongMaterial({
      map: spaceJunkTexture2,
      side: THREE.DoubleSide,
      specular: 0xffffff,
      shininess: 5
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(150, 50, 200);
    blackHole.add(cone);

    scene.add(blackHole);

    // Refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = clock.getElapsedTime();
      
      // Twinkling star effect
      const updateStarTwinkle = (starField: THREE.Points) => {
        const colors = starField.geometry.attributes.color.array as Float32Array;
        const starData = starField as THREE.Points & StarFieldData;
        const originalColors = starData.originalColors;
        const twinklePhase = starData.twinklePhase || 0;
        
        if (!originalColors) return;
        
        for (let i = 0; i < colors.length; i += 3) {
          const twinkle = Math.sin(time * 2 + twinklePhase + i * 0.01) * 0.3 + 0.7;
          colors[i] = originalColors[i] * twinkle;
          colors[i + 1] = originalColors[i + 1] * twinkle;
          colors[i + 2] = originalColors[i + 2] * twinkle;
        }
        starField.geometry.attributes.color.needsUpdate = true;
      };
      
      updateStarTwinkle(starField1);
      updateStarTwinkle(starField2);
      updateStarTwinkle(starField3);
      updateStarTwinkle(starField4);
      
      // Animate star fields rotation
      starField1.rotation.y += 0.0002;
      starField1.rotation.x += 0.0001;
      starField2.rotation.y -= 0.0003;
      starField2.rotation.z += 0.0001;
      starField3.rotation.y += 0.0004;
      starField3.rotation.x -= 0.0002;
      starField4.rotation.y -= 0.0001;
      starField4.rotation.z -= 0.0001;
      
      blackHole.rotation.y += 0.002;
      spaceJunk.rotation.x -= 0.003;
      cone.rotation.x -= 0.005;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (mount && camera && renderer) {
        const newWidth = mount.clientWidth;
        const newHeight = mount.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && mount) {
        mount.removeChild(rendererRef.current.domElement);
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