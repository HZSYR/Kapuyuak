import { useEffect, useRef, useState, useCallback } from 'react';

// ─── SERVER LOCATION ─────────────────────────────────────────────────────────
const SERVER = { lat: -0.9471, lng: 100.3511, label: 'SERVER PUSAT', city: 'Padang', region: 'Sumatera Barat', country: 'Indonesia' };

export default function Globe3D({ logs = [], onMarkersUpdate }) {
  const globeRef = useRef();
  const containerRef = useRef();
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [attackMarkers, setAttackMarkers] = useState([]);
  const [polygons, setPolygons] = useState([]);

  // ── Custom React tooltip state (no flickering) ─────────────────────────────
  const [tooltip, setTooltip] = useState({ visible: false, data: null, x: 0, y: 0 });
  const tooltipTimer = useRef(null);

  // ── Dynamic import (client-side only, no SSR) ──────────────────────────────
  useEffect(() => {
    import('react-globe.gl').then((mod) => {
      setGlobeComponent(() => mod.default);
    });
  }, []);

  // ── Load GeoJSON country polygons from GitHub ──────────────────────────────
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json())
      .then(data => setPolygons(data.features))
      .catch(() => {
        // fallback to natural-earth if primary fails
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
          .then(r => r.json())
          .then(data => setPolygons(data.features))
          .catch(console.error);
      });
  }, []);

  // ── Process logs into GeoIP markers ───────────────────────────────────────
  useEffect(() => {
    if (!logs || logs.length === 0) return;
    const uniqueIps = [...new Set(logs.map(l => l.ipAddress))]
      .filter(ip => ip && ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1')
      .slice(0, 20);
    if (uniqueIps.length === 0) return;

    const counts = logs.reduce((acc, log) => {
      acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
      return acc;
    }, {});

    const fetchGeoData = async () => {
      try {
        const promises = uniqueIps.map(async (ip) => {
          try {
            const res = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                const city = data.city || '';
                const region = data.region || '';
                const country = data.country || '';
                // Build location label: "Kota, Provinsi, Negara" — skip empty parts
                const parts = [city, region, country].filter(Boolean);
                const label = parts.join(', ');
                return {
                  lat: parseFloat(data.latitude),
                  lng: parseFloat(data.longitude),
                  label,
                  city, region, country,
                  count: counts[ip] || 1,
                  size: Math.min(0.1 + ((counts[ip] || 1) * 0.05), 0.3)
                };
              }
            }
          } catch (e) {}
          return null;
        });

        const results = await Promise.all(promises);
        const validMarkers = results.filter(m => m !== null);
        setAttackMarkers(validMarkers);

        // Aggregate by country for sidebar
        if (onMarkersUpdate && typeof onMarkersUpdate === 'function') {
          const countryMap = {};
          validMarkers.forEach(m => {
            if (countryMap[m.country]) {
              countryMap[m.country].count += m.count;
            } else {
              countryMap[m.country] = { ...m };
            }
          });
          onMarkersUpdate(Object.values(countryMap));
        }
      } catch (e) {
        console.error('GeoIP fetch error', e);
      }
    };
    fetchGeoData();
  }, [logs]);

  // ── Measure container ──────────────────────────────────────────────────────
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

  // ── Globe controls (auto-rotate + zoom) ───────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.enableZoom = true;
    controls.minDistance = 150;
    controls.maxDistance = 500;
    const handleZoom = () => {
      controls.autoRotate = controls.getDistance() > controls.minDistance + 5;
    };
    controls.addEventListener('change', handleZoom);
    return () => controls.removeEventListener('change', handleZoom);
  }, [GlobeComponent]);

  // ── Custom tooltip handlers ────────────────────────────────────────────────
  const showTooltip = useCallback((data, evt) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({
      visible: true,
      data,
      x: evt.clientX - (rect?.left || 0) + 14,
      y: evt.clientY - (rect?.top || 0) - 20,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    tooltipTimer.current = setTimeout(() => {
      setTooltip(t => ({ ...t, visible: false }));
    }, 120);
  }, []);

  // ── Polygon hover: look up country name from GeoJSON properties ────────────
  const handlePolygonHover = useCallback((polygon, prevPolygon, evt) => {
    if (!polygon) { hideTooltip(); return; }
    const props = polygon.properties || {};
    const countryName = props.ADMIN || props.name || props.NAME || props.NAME_EN || 'Unknown';
    showTooltip({ type: 'country', label: countryName }, evt || { clientX: 0, clientY: 0 });
  }, [showTooltip, hideTooltip]);

  // ── Point hover: show attack info ─────────────────────────────────────────
  const handlePointHover = useCallback((point, prevPoint, evt) => {
    if (!point) { hideTooltip(); return; }
    showTooltip({ type: 'point', ...point }, evt || { clientX: 0, clientY: 0 });
  }, [showTooltip, hideTooltip]);

  // ── All points data (no invisible hitboxes anymore — use polygon hover instead) ──
  const allPoints = [
    { ...SERVER, size: 0.2, color: '#00ffff', type: 'server' },
    ...attackMarkers.map(m => ({ ...m, color: '#ff0033', type: 'attack' })),
  ];

  // ── Tooltip content builder ────────────────────────────────────────────────
  const renderTooltipContent = () => {
    const d = tooltip.data;
    if (!d) return null;
    const isServer = d.type === 'server';
    const isCountry = d.type === 'country';
    const textColor = isServer ? '#00ffff' : '#ff0033';

    if (isCountry) {
      return (
        <div style={{ color: '#aaa', fontSize: 13 }}>
          <b style={{ color: '#ffffff', fontSize: 14 }}>{d.label}</b>
        </div>
      );
    }
    return (
      <>
        <div style={{ borderBottom: `1px solid ${textColor}30`, paddingBottom: 6, marginBottom: 6 }}>
          <b style={{ color: textColor, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}>
            {isServer ? '🛡️ SERVER PUSAT' : '🚨 ATTACK ORIGIN'}
          </b>
        </div>
        {isServer ? (
          <>
            <div style={{ color: '#00ffff', fontSize: 12 }}>📍 Padang, Sumatera Barat</div>
            <div style={{ color: '#00ffff', fontSize: 12 }}>🌏 Indonesia</div>
            <div style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>✅ Sistem OJS Terlindungi</div>
          </>
        ) : (
          <>
            {d.city && <div style={{ color: '#fff', fontSize: 12 }}>📍 {d.city}{d.region ? `, ${d.region}` : ''}</div>}
            {d.country && <div style={{ color: '#fff', fontSize: 12 }}>🌏 {d.country}</div>}
            {d.count && <div style={{ color: '#ffaa00', fontSize: 12, marginTop: 4 }}>⚡ {d.count.toLocaleString()} attacks blocked</div>}
          </>
        )}
      </>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center cursor-move" style={{ position: 'relative' }}>
      {GlobeComponent ? (
        <GlobeComponent
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"

          // ── HD Earth textures ──
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

          // ── Country polygons from GeoJSON ──
          polygonsData={polygons}
          polygonCapColor={() => 'rgba(0,0,0,0)'}
          polygonSideColor={() => 'rgba(255,255,255,0.04)'}
          polygonStrokeColor={() => 'rgba(100,200,255,0.15)'}
          polygonAltitude={0.001}
          onPolygonHover={handlePolygonHover}
          polygonLabel={() => ''}

          // ── Attack marker dots ──
          pointsData={allPoints}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.02}
          pointRadius={(d) => d.size * 0.5}
          pointsMerge={false}
          pointResolution={64}
          pointLabel={() => ''}
          onPointHover={handlePointHover}

          // ── Radar Rings ──
          ringsData={[
            { lat: SERVER.lat, lng: SERVER.lng, maxR: 2, propagationSpeed: 1.5, repeatPeriod: 1000, color: '#00ffff' },
            ...attackMarkers.map(m => ({ lat: m.lat, lng: m.lng, maxR: 1.2, propagationSpeed: 1, repeatPeriod: 1500, color: '#ff0033' }))
          ]}
          ringLat="lat"
          ringLng="lng"
          ringColor="color"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"

          // ── Atmosphere ──
          showAtmosphere={true}
          atmosphereColor="#00bbff"
          atmosphereAltitude={0.25}

          // ── Attack arcs ──
          arcsData={attackMarkers}
          arcStartLat="lat"
          arcStartLng="lng"
          arcEndLat={SERVER.lat}
          arcEndLng={SERVER.lng}
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

      {/* ── Custom React Tooltip (no flickering!) ── */}
      {tooltip.visible && tooltip.data && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            pointerEvents: 'none',
            zIndex: 999,
            background: 'rgba(8, 12, 28, 0.92)',
            border: `1px solid ${tooltip.data.type === 'server' ? '#00ffff' : (tooltip.data.type === 'country' ? 'rgba(100,200,255,0.4)' : '#ff0033')}`,
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            color: '#fff',
            backdropFilter: 'blur(8px)',
            boxShadow: tooltip.data.type === 'server'
              ? '0 0 20px rgba(0,255,255,0.4)'
              : (tooltip.data.type === 'country' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 0 20px rgba(255,0,51,0.4)'),
            minWidth: 160,
            transition: 'opacity 0.15s ease',
          }}
        >
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
            background: tooltip.data.type === 'server' ? '#00ffff' : (tooltip.data.type === 'country' ? 'rgba(100,200,255,0.4)' : '#ff0033'),
            borderRadius: '8px 8px 0 0',
          }} />
          {renderTooltipContent()}
        </div>
      )}
    </div>
  );
}
