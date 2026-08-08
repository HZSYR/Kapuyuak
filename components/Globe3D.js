import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export default function Globe3D() {
  const canvasRef = useRef();

  useEffect(() => {
    let phi = 0;
    
    // Resize observer to make the globe responsive
    let width = 0;
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
    window.addEventListener('resize', onResize)
    onResize()

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1, // dark mode
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.05, 0.1, 0.25], // deep space blue
      markerColor: [1, 0.2, 0.3], // glowing neon red
      glowColor: [0.1, 0.6, 1], // cyan glow atmosphere
      markers: [
        // longitude, latitude, size
        { location: [39.9042, 116.4074], size: 0.12 }, // China (Beijing)
        { location: [37.7595, -122.4367], size: 0.1 },  // US (SF)
        { location: [1.3521, 103.8198], size: 0.09 },  // Singapore
        { location: [51.5074, -0.1278], size: 0.08 },  // UK (London)
        { location: [55.7558, 37.6173], size: 0.09 },  // Russia (Moscow)
        { location: [48.8566, 2.3522], size: 0.06 },   // France (Paris)
        { location: [35.6762, 139.6503], size: 0.08 }, // Japan (Tokyo)
        { location: [-6.2088, 106.8456], size: 0.05 }, // Indonesia (Jakarta)
        { location: [52.3676, 4.9041], size: 0.06 },   // Netherlands (Amsterdam)
        { location: [-23.5505, -46.6333], size: 0.07 } // Brazil (Sao Paulo)
      ],
      onRender: (state) => {
        // Automatically rotate the globe smoothly
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="w-full max-w-[500px] mx-auto aspect-square relative flex items-center justify-center">
      <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-0 transition-opacity duration-1000 ease-in-out drop-shadow-[0_0_30px_rgba(0,200,255,0.2)] cursor-grab active:cursor-grabbing"
        style={{ opacity: 1, contain: 'layout paint size' }}
      />
    </div>
  );
}
