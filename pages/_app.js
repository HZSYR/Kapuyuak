import Head from 'next/head';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 1. Inisialisasi DisableDevtool untuk memblokir absolut:
    // Undocked Devtools, Eruda, F12, Klik Kanan, Ctrl+Shift+I, dll.
    import('disable-devtool').then(({ default: DisableDevtool }) => {
      DisableDevtool({
        url: "https://www.google.com", // Redirect jika hacker bandel
        timeOutUrl: "https://www.google.com",
        disableMenu: true,
        disableSelect: true,
        disableCopy: true,
        disableCut: true,
        disablePaste: true,
        clearLog: true,
        disableIframeParents: true,
      });
    });
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
