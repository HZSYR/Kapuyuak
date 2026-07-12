import Head from 'next/head';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 1. Blokir klik kanan
    const handleContextMenu = (e) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);

    // 2. Blokir shortcut keyboard Inspect Element
    const handleKeyDown = (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
        window.location.href = "https://www.google.com";
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 3. Jebakan Debugger Ekstrim (Infinite Loop)
    const devtoolsBlocker = function() {
      const start = new Date().getTime();
      debugger;
      const end = new Date().getTime();
      if (end - start > 50) {
        document.documentElement.innerHTML = "<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";
        window.location.href = "https://www.google.com";
      }
      setTimeout(devtoolsBlocker, 50);
    };
    devtoolsBlocker();

    // 4. Deteksi Perubahan Ukuran Layar (Jika DevTools di-dock ke samping/bawah)
    const checkDevToolsSize = function() {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        document.documentElement.innerHTML = "<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";
        window.location.href = "https://www.google.com";
      }
    };
    const sizeTrap = setInterval(checkDevToolsSize, 500);
    window.addEventListener("resize", checkDevToolsSize);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkDevToolsSize);
      clearInterval(sizeTrap);
    };
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
        <title>KPK4444 — by.150141146151172150</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
