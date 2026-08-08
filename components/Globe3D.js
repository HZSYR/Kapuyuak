import createGlobe from 'cobe';
import { useEffect, useRef, useCallback } from 'react';

export default function Globe3D() {
  const canvasRef = useRef();
  const globeRef = useRef(null);
  const phiRef = useRef(0);

  const setupGlobe = useCallback(() => {
    if (!canvasRef.current) return;

    // Destroy previous instance if exists
    if (globeRef.current) {
      globeRef.current.destroy();
      globeRef.current = null;
    }

    const canvas = canvasRef.current;
    const containerWidth = canvas.parentElement.offsetWidth;
    if (containerWidth <= 0) return;

    // Set canvas dimensions explicitly
    const size = containerWidth;
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: pixelRatio,
      width: size * pixelRatio,
      height: size * pixelRatio,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 3,
      mapSamples: 30000,
      mapBrightness: 4,
      baseColor: [0.15, 0.25, 0.45],
      markerColor: [1, 0.15, 0.2],
      glowColor: [0.06, 0.2, 0.5],
      markers: [
        { location: [39.9042, 116.4074], size: 0.1 },
        { location: [31.2304, 121.4737], size: 0.08 },
        { location: [37.7749, -122.4194], size: 0.09 },
        { location: [40.7128, -74.0060], size: 0.08 },
        { location: [1.3521, 103.8198], size: 0.07 },
        { location: [51.5074, -0.1278], size: 0.07 },
        { location: [55.7558, 37.6173], size: 0.08 },
        { location: [48.8566, 2.3522], size: 0.05 },
        { location: [35.6762, 139.6503], size: 0.07 },
        { location: [-6.2088, 106.8456], size: 0.06 },
        { location: [52.3676, 4.9041], size: 0.05 },
        { location: [-23.5505, -46.6333], size: 0.06 },
        { location: [28.6139, 77.2090], size: 0.07 },
        { location: [37.5665, 126.9780], size: 0.06 },
        { location: [-33.8688, 151.2093], size: 0.05 },
      ],
      onRender: (state) => {
        state.phi = phiRef.current;
        phiRef.current += 0.004;
        state.width = size * pixelRatio;
        state.height = size * pixelRatio;
      },
    });

    // Fade in
    canvas.style.opacity = '1';
  }, []);

  useEffect(() => {
    // Small delay to ensure DOM is ready and has layout dimensions
    const timer = setTimeout(setupGlobe, 100);

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupGlobe, 200);
    };
    let resizeTimer;

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      if (globeRef.current) {
        globeRef.current.destroy();
      }
    };
  }, [setupGlobe]);

  return (
    <div className="w-full aspect-square relative flex items-center justify-center">
      {/* Soft ambient glow behind globe */}
      <div className="absolute inset-[15%] bg-cyan-500/8 rounded-full blur-[60px] pointer-events-none"></div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: 0,
          transition: 'opacity 1s ease-in-out',
          cursor: 'grab',
          contain: 'layout paint size',
        }}
      />
    </div>
  );
}
