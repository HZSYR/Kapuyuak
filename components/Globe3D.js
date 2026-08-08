import { useEffect, useRef, useState } from 'react';

// Attack marker data — real cities that generate attacks
const ATTACK_MARKERS = [
  { lat: 39.9042,  lng: 116.4074, label: 'Beijing, China',        count: 14592, size: 0.9 },
  { lat: 31.2304,  lng: 121.4737, label: 'Shanghai, China',       count: 9810,  size: 0.8 },
  { lat: 22.3964,  lng: 114.1095, label: 'Hong Kong',             count: 7230,  size: 0.7 },
  { lat: 37.7749,  lng: -122.4194,label: 'San Francisco, USA',    count: 8241,  size: 0.75 },
  { lat: 40.7128,  lng: -74.0060, label: 'New York, USA',         count: 6500,  size: 0.7 },
  { lat: 1.3521,   lng: 103.8198, label: 'Singapore',             count: 3105,  size: 0.6 },
  { lat: 51.5074,  lng: -0.1278,  label: 'London, UK',            count: 2890,  size: 0.58 },
  { lat: 55.7558,  lng: 37.6173,  label: 'Moscow, Russia',        count: 1894,  size: 0.55 },
  { lat: 48.8566,  lng: 2.3522,   label: 'Paris, France',         count: 1540,  size: 0.5 },
  { lat: 35.6762,  lng: 139.6503, label: 'Tokyo, Japan',          count: 1720,  size: 0.52 },
  { lat: -6.2088,  lng: 106.8456, label: 'Jakarta, Indonesia',    count: 943,   size: 0.45 },
  { lat: 52.3676,  lng: 4.9041,   label: 'Amsterdam, NL',         count: 1100,  size: 0.47 },
  { lat: -23.5505, lng: -46.6333, label: 'São Paulo, Brazil',     count: 870,   size: 0.44 },
  { lat: 28.6139,  lng: 77.2090,  label: 'New Delhi, India',      count: 980,   size: 0.46 },
  { lat: 37.5665,  lng: 126.9780, label: 'Seoul, South Korea',    count: 850,   size: 0.43 },
  { lat: 52.5200,  lng: 13.4050,  label: 'Berlin, Germany',       count: 760,   size: 0.42 },
  { lat: 25.2048,  lng: 55.2708,  label: 'Dubai, UAE',            count: 680,   size: 0.4 },
  { lat: 19.0760,  lng: 72.8777,  label: 'Mumbai, India',         count: 790,   size: 0.43 },
];

export default function Globe3D() {
  const globeRef = useRef();
  const containerRef = useRef();
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  // Dynamically import react-globe.gl (client-side only, no SSR)
  useEffect(() => {
    import('react-globe.gl').then((mod) => {
      setGlobeComponent(() => mod.default);
    });
  }, []);

  // Measure container dimensions
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setDimensions({ width: w, height: w });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Auto-rotate the globe
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableZoom = false;
    }
  }, [GlobeComponent]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      {GlobeComponent ? (
        <GlobeComponent
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"

          // ── Earth textures from three-globe's own CDN (reliable) ──
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

          // ── Attack marker dots ──
          pointsData={ATTACK_MARKERS}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => '#ff0033'}
          pointAltitude={0.03}
          pointRadius={(d) => d.size * 1.5}
          pointsMerge={false}
          pointResolution={32}

          // ── Label on hover ──
          pointLabel={(d) => `
            <div style="background:rgba(0,0,0,0.85);border:1px solid #ff2233;padding:8px 12px;border-radius:8px;font-size:12px;font-family:monospace;color:#fff;box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);">
              <b style="color:#ff4455;font-size:14px;">${d.label}</b><br/>
              <span style="color:#ffaa00">⚡ ${d.count.toLocaleString()} attacks blocked</span>
            </div>
          `}

          // ── Atmosphere ──
          showAtmosphere={true}
          atmosphereColor="#00bbff"
          atmosphereAltitude={0.25}

          // ── Arcs (attack arcs from each origin to a "target" in SE Asia) ──
          arcsData={ATTACK_MARKERS.slice(0, 12)}
          arcStartLat={(d) => d.lat}
          arcStartLng={(d) => d.lng}
          arcEndLat={-6.2088}
          arcEndLng={106.8456}
          arcColor={() => ['rgba(255,0,50,0)', 'rgba(255,0,50,1)', 'rgba(255,0,50,0)']}
          arcDashLength={0.5}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          arcStroke={1.5}
          arcAltitudeAutoScale={0.4}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
