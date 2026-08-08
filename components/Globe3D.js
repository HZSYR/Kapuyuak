import { useEffect, useRef, useState, useCallback } from 'react';

const geoCache = new Map();
const GEO_TIMEOUT_MS = 5000;

// ─── SERVER LOCATION ─────────────────────────────────────────────────────────
const SERVER = { lat: -0.9471, lng: 100.3511, label: 'SERVER PUSAT', city: 'Padang', region: 'Sumatera Barat', country: 'Indonesia' };

export default function Globe3D({ logs = [], onMarkersUpdate }) {
  const globeRef = useRef();
  const containerRef = useRef();
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [attackMarkers, setAttackMarkers] = useState([]);

  // ── Custom React tooltip state (lightweight & stable) ──────────────────────
  const [tooltip, setTooltip] = useState({ visible: false, data: null, x: 0, y: 0 });
  const tooltipTimer = useRef(null);

  // ── Dynamic import (client-side only, deferred until browser is idle) ────────
  useEffect(() => {
    let cancelled = false;
    const loadGlobe = () => {
      import('react-globe.gl').then((mod) => {
        if (!cancelled) setGlobeComponent(() => mod.default);
      });
    };
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(loadGlobe, { timeout: 1200 })
      : window.setTimeout(loadGlobe, 250);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && typeof idleId === 'number') window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  // ── Process logs into GeoIP markers ───────────────────────────────────────
  useEffect(() => {
    if (!logs || logs.length === 0) return;
    let cancelled = false;
    const uniqueIps = [...new Set(logs.map(l => l.ipAddress))]
      .filter(ip => ip && ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1')
      .slice(0, 5);
    if (uniqueIps.length === 0) return;

    const counts = logs.reduce((acc, log) => {
      acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
      return acc;
    }, {});

    const fetchGeoData = async () => {
      try {
        const results = await Promise.all(uniqueIps.map(async (ip) => {
          if (geoCache.has(ip)) return { ...geoCache.get(ip), count: counts[ip] || 1 };
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
          try {
            const res = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, { signal: controller.signal });
            if (!res.ok) return null;
            const data = await res.json();
            if (!data.latitude || !data.longitude) return null;
            const city = data.city || '';
            const region = data.region || '';
            const country = data.country || '';
            const marker = {
              lat: parseFloat(data.latitude),
              lng: parseFloat(data.longitude),
              label: [city, region, country].filter(Boolean).join(', '),
              city, region, country,
              size: Math.min(0.12 + ((counts[ip] || 1) * 0.04), 0.3)
            };
            geoCache.set(ip, marker);
            return { ...marker, count: counts[ip] || 1 };
          } catch (e) {
            return null;
          } finally {
            clearTimeout(timeoutId);
          }
        }));

        if (cancelled) return;
        const validMarkers = results.filter(Boolean);
        setAttackMarkers(validMarkers);
        if (onMarkersUpdate && typeof onMarkersUpdate === 'function') {
          const countryMap = {};
          validMarkers.forEach(marker => {
            countryMap[marker.country] = countryMap[marker.country]
              ? { ...countryMap[marker.country], count: countryMap[marker.country].count + marker.count }
              : { ...marker };
          });
          onMarkersUpdate(Object.values(countryMap));
        }
      } catch (e) {
        if (!cancelled) console.error('GeoIP fetch error', e);
      }
    };

    fetchGeoData();
    return () => { cancelled = true; };
  }, [logs, onMarkersUpdate]);

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

  // ── Globe controls (auto-rotate + zoom limits) ─────────────────────────────
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
    }, 150);
  }, []);

  const handlePointHover = useCallback((point, prevPoint, evt) => {
    if (!point) { hideTooltip(); return; }
    showTooltip(point, evt || { clientX: 0, clientY: 0 });
  }, [showTooltip, hideTooltip]);

  // ── All points (Padang server + attackers) ──────────────────────────────────
  const allPoints = [
    { ...SERVER, size: 0.25, color: '#00ffff', type: 'server' },
    ...attackMarkers.map(m => ({ ...m, color: '#ff0033', type: 'attack' })),
  ];

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center cursor-move" style={{ position: 'relative' }}>
      {GlobeComponent ? (
        <GlobeComponent
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"

          // ── Earth textures ──
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"

          // ── Attack marker dots ──
          pointsData={allPoints}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.02}
          pointRadius={(d) => d.size * 0.8}
          pointsMerge={true}
          pointResolution={16}
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

          // ── Attack Arcs ──
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

      {/* ── Custom React Tooltip (ultra fast, no WebGL load, zero flicker) ── */}
      {tooltip.visible && tooltip.data && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            pointerEvents: 'none',
            zIndex: 999,
            background: 'rgba(8, 12, 28, 0.92)',
            border: `1px solid ${tooltip.data.type === 'server' ? '#00ffff' : '#ff0033'}`,
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            color: '#fff',
            backdropFilter: 'blur(8px)',
            boxShadow: tooltip.data.type === 'server' ? '0 0 20px rgba(0,255,255,0.4)' : '0 0 20px rgba(255,0,51,0.4)',
            minWidth: 160,
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
            background: tooltip.data.type === 'server' ? '#00ffff' : '#ff0033',
            borderRadius: '8px 8px 0 0',
          }} />
          
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4, marginBottom: 6 }}>
            <b style={{ color: tooltip.data.type === 'server' ? '#00ffff' : '#ff0033', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}>
              {tooltip.data.type === 'server' ? '🛡️ SERVER PUSAT' : '🚨 ATTACK ORIGIN'}
            </b>
          </div>

          {tooltip.data.type === 'server' ? (
            <>
              <div style={{ color: '#00ffff', fontSize: 12 }}>📍 Padang, Sumatera Barat</div>
              <div style={{ color: '#00ffff', fontSize: 12 }}>🌏 Indonesia</div>
              <div style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>✅ Sistem OJS Terlindungi</div>
            </>
          ) : (
            <>
              {tooltip.data.city && <div style={{ color: '#fff', fontSize: 12 }}>📍 {tooltip.data.city}{tooltip.data.region ? `, ${tooltip.data.region}` : ''}</div>}
              {tooltip.data.country && <div style={{ color: '#fff', fontSize: 12 }}>🌏 {tooltip.data.country}</div>}
              {tooltip.data.count && <div style={{ color: '#ffaa00', fontSize: 12, marginTop: 4 }}>⚡ {tooltip.data.count.toLocaleString()} attacks blocked</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
