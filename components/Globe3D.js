import { useEffect, useRef, useState } from 'react';

export default function Globe3D({ logs = [], onMarkersUpdate }) {
  const globeRef = useRef();
  const containerRef = useRef();
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  
  // Real data state
  const [attackMarkers, setAttackMarkers] = useState([]);
  
  // Dynamically import react-globe.gl (client-side only, no SSR)
  useEffect(() => {
    import('react-globe.gl').then((mod) => {
      setGlobeComponent(() => mod.default);
    });
  }, []);

  // Process real logs into GeoIP coordinates
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // Get up to 15 unique IPs from recent logs
    const uniqueIps = [...new Set(logs.map(l => l.ipAddress))].filter(ip => ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1').slice(0, 15);
    
    if (uniqueIps.length === 0) return;

    const fetchGeoData = async () => {
      try {
        // Count occurrences of each IP in logs to determine size/count
        const counts = logs.reduce((acc, log) => {
          acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
          return acc;
        }, {});

        // Use HTTPS supported GeoJS API for real data without mixed-content errors
        const promises = uniqueIps.map(async (ip) => {
          try {
            const res = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                return {
                  lat: parseFloat(data.latitude),
                  lng: parseFloat(data.longitude),
                  label: `${data.city || 'Unknown'}, ${data.country}`,
                  country: data.country,
                  count: counts[ip] || 1,
                  size: Math.min(0.4 + ((counts[ip] || 1) * 0.1), 1.0)
                };
              }
            }
          } catch(err) { }
          return null;
        });

        const results = await Promise.all(promises);
        const validMarkers = results.filter(m => m !== null);
        
        setAttackMarkers(validMarkers);

        // Pass resolved real data back to dashboard for the Top Origins Sidebar
        if (onMarkersUpdate && typeof onMarkersUpdate === 'function') {
           // Aggregate by country for the sidebar
           const countryMap = {};
           validMarkers.forEach(m => {
             if (countryMap[m.country]) {
               countryMap[m.country].count += m.count;
             } else {
               countryMap[m.country] = { ...m };
             }
           });
           const aggregated = Object.values(countryMap);
           onMarkersUpdate(aggregated);
        }
        
      } catch (e) {
        console.error("Failed to fetch GeoIP for Globe", e);
      }
    };
    
    fetchGeoData();
  }, [logs]);

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

  // Auto-rotate and zoom limits
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableZoom = true;
      controls.minDistance = 150; // Prevent zooming too close (inside the globe)
      controls.maxDistance = 500; // Prevent zooming too far out
    }
  }, [GlobeComponent]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center cursor-move">
      {GlobeComponent ? (
        <GlobeComponent
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"

          // ── HD Earth textures for maximum realism ──
          globeImageUrl="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg"
          bumpImageUrl="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg"
          
          // ── Attack marker dots ──
          pointsData={attackMarkers}
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
          arcsData={attackMarkers.slice(0, 12)}
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
