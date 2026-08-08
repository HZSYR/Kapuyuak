import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Attack marker locations [lat, lon, intensity]
const ATTACK_LOCATIONS = [
  [39.9042, 116.4074, 1.0],   // China (Beijing) - largest
  [31.2304, 121.4737, 0.9],   // China (Shanghai)
  [22.3964, 114.1095, 0.8],   // Hong Kong
  [37.7749, -122.4194, 0.85], // USA (San Francisco)
  [40.7128, -74.0060, 0.8],   // USA (New York)
  [1.3521, 103.8198, 0.75],   // Singapore
  [51.5074, -0.1278, 0.7],    // UK (London)
  [55.7558, 37.6173, 0.8],    // Russia (Moscow)
  [48.8566, 2.3522, 0.6],     // France (Paris)
  [35.6762, 139.6503, 0.7],   // Japan (Tokyo)
  [-6.2088, 106.8456, 0.65],  // Indonesia (Jakarta)
  [52.3676, 4.9041, 0.6],     // Netherlands (Amsterdam)
  [-23.5505, -46.6333, 0.65], // Brazil (São Paulo)
  [28.6139, 77.2090, 0.7],    // India (New Delhi)
  [37.5665, 126.9780, 0.65],  // South Korea (Seoul)
  [52.5200, 13.4050, 0.6],    // Germany (Berlin)
  [25.2048, 55.2708, 0.55],   // UAE (Dubai)
  [19.0760, 72.8777, 0.6],    // India (Mumbai)
];

function latLonToXYZ(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function Globe3D() {
  const mountRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const size = container.offsetWidth;
    if (size <= 0) return;

    // ── Scene ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0x333355, 1.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // ── Earth Globe ──
    const textureLoader = new THREE.TextureLoader();

    const earthGeo = new THREE.SphereGeometry(1, 64, 64);

    // Use NASA Blue Marble texture (public CDN)
    const earthTexture = textureLoader.load(
      'https://unpkg.com/three-globe@2.26.4/example/img/earth-blue-marble.jpg'
    );
    const bumpTexture = textureLoader.load(
      'https://unpkg.com/three-globe@2.26.4/example/img/earth-topology.png'
    );
    const cloudTexture = textureLoader.load(
      'https://unpkg.com/three-globe@2.26.4/example/img/earth-water.png'
    );

    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.05,
      specularMap: cloudTexture,
      specular: new THREE.Color(0x226688),
      shininess: 15,
    });

    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // ── Cloud Layer ──
    const cloudGeo = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://unpkg.com/three-globe@2.26.4/example/img/earth-water.png'),
      transparent: true,
      opacity: 0.25,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(clouds);

    // ── Atmosphere Glow ──
    const atmGeo = new THREE.SphereGeometry(1.06, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: {},
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
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.1, 0.5, 1.0, 1.0) * intensity;
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    scene.add(atmosphere);

    // ── Attack Markers (Red Glowing Dots) ──
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    ATTACK_LOCATIONS.forEach(([lat, lon, intensity]) => {
      const pos = latLonToXYZ(lat, lon, 1.01);

      // Outer glow ring
      const ringGeo = new THREE.RingGeometry(0.012, 0.025, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.1, 0.1),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5 * intensity,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      markerGroup.add(ring);

      // Core dot
      const dotGeo = new THREE.CircleGeometry(0.012 * intensity, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.15, 0.15),
        side: THREE.DoubleSide,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.lookAt(pos.clone().multiplyScalar(2));
      markerGroup.add(dot);
    });

    // ── Stars Background ──
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 600;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // ── Animation Loop ──
    let pulse = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      earth.rotation.y += 0.0015;
      clouds.rotation.y += 0.0018;
      markerGroup.rotation.y = earth.rotation.y;

      // Pulse ring markers
      pulse += 0.05;
      markerGroup.children.forEach((child, i) => {
        if (i % 2 === 0) { // rings only
          child.scale.setScalar(1 + 0.3 * Math.abs(Math.sin(pulse + i)));
          child.material.opacity = 0.3 + 0.3 * Math.abs(Math.sin(pulse + i));
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full aspect-square"
      style={{ maxWidth: '500px', margin: '0 auto' }}
    />
  );
}
