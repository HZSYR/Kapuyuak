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
                  label: data.city ? `${data.city}, ${data.country}` : (data.region ? `${data.region}, ${data.country}` : data.country),
                  country: data.country,
                  count: counts[ip] || 1,
                  size: Math.min(0.1 + ((counts[ip] || 1) * 0.05), 0.3)
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
      
      // Stop rotation when zoomed all the way in
      const handleZoom = () => {
        // If distance is very close to minDistance (mentok habis), stop rotating
        if (controls.getDistance() <= controls.minDistance + 5) {
          controls.autoRotate = false;
        } else {
          controls.autoRotate = true;
        }
      };
      
      controls.addEventListener('change', handleZoom);
      return () => controls.removeEventListener('change', handleZoom);
    }
  }, [GlobeComponent]);
  const getTooltipHtml = (d) => {
    const textColor = d.label.includes('SERVER PUSAT') ? '#00ffff' : '#ff0033';
    return `
    <div class="cyber-tooltip" style="border-color: ${textColor}; box-shadow: 0 0 15px ${textColor}80, inset 0 0 10px rgba(0, 0, 0, 0.5);">
      <div class="cyber-tooltip-line" style="background: ${textColor}; box-shadow: 0 0 10px ${textColor};"></div>
      <b style="color:${textColor};font-size:15px;letter-spacing:1px;text-transform:uppercase;">${d.label}</b><br/>
      <div style="margin-top:6px;font-size:13px;display:flex;align-items:center;gap:6px;">
        ${d.count ? `<span style="color:#ffaa00;text-shadow:0 0 5px rgba(255,170,0,0.5)">⚡ ${d.count.toLocaleString()} ATTACKS BLOCKED</span>` : '<span style="color:#00ffff;text-shadow:0 0 5px rgba(0,255,255,0.5)">🛡️ SISTEM OJS TERLINDUNGI</span>'}
      </div>
    </div>
  `};

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center cursor-move">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes cyber-popup {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          70% { transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .cyber-tooltip {
          animation: cyber-popup 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          background: rgba(10, 15, 30, 0.85);
          border: 1px solid transparent;
          padding: 10px 14px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          color: #fff;
          backdrop-filter: blur(4px);
          position: relative;
          overflow: hidden;
          pointer-events: none;
        }
        .cyber-tooltip-line {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 2px;
        }
      `}} />
      {GlobeComponent ? (
        <GlobeComponent
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"

          // ── HD Earth textures for maximum realism ──
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          
          // ── Attack marker dots & Invisible Hitboxes ──
          pointsData={[
            // Visual small dots
            { lat: -0.9471, lng: 100.3511, size: 0.2, color: '#00ffff', label: 'SERVER PUSAT (Padang, Indonesia)', isHitbox: false },
            ...attackMarkers.map(m => ({ ...m, isHitbox: false })),
            // Invisible larger hitboxes for super easy hovering
            { lat: -0.9471, lng: 100.3511, size: 2.0, color: 'rgba(0,0,0,0.01)', label: 'SERVER PUSAT (Padang, Indonesia)', isHitbox: true },
            ...attackMarkers.map(m => ({ ...m, size: 2.0, color: 'rgba(0,0,0,0.01)', isHitbox: true }))
          ]}
          pointLat="lat"
          pointLng="lng"
          pointColor={(d) => d.color || (d.isHitbox ? 'rgba(0,0,0,0.01)' : '#ff0033')}
          pointAltitude={(d) => d.isHitbox ? 0.08 : 0.02}
          pointRadius={(d) => d.size * (d.isHitbox ? 1.5 : 0.5)}
          pointsMerge={false}
          pointResolution={64}

          // ── Radar Rings ──
          ringsData={[
            { lat: -0.9471, lng: 100.3511, maxR: 2, propagationSpeed: 1.5, repeatPeriod: 1000, color: '#00ffff', label: 'SERVER PUSAT (Padang, Indonesia)' },
            ...attackMarkers.map(m => ({ lat: m.lat, lng: m.lng, maxR: 1.2, propagationSpeed: 1, repeatPeriod: 1500, color: '#ff0033', label: m.label, count: m.count }))
          ]}
          ringLat="lat"
          ringLng="lng"
          ringColor={(d) => d.color}
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"

          // ── Label on hover (applied to points only to prevent raycaster flickering) ──
          pointLabel={(d) => getTooltipHtml(d)}

          // ── Atmosphere ──
          showAtmosphere={true}
          atmosphereColor="#00bbff"
          atmosphereAltitude={0.25}

          // ── Arcs (attack arcs from each origin to Padang) ──
          arcsData={attackMarkers}
          arcStartLat={(d) => d.lat}
          arcStartLng={(d) => d.lng}
          arcEndLat={-0.9471}
          arcEndLng={100.3511}
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
