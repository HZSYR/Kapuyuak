import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Activate() {
  const router = useRouter();
  const { key } = router.query;
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!key) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <Head><script src="https://cdn.tailwindcss.com"></script></Head>
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-3xl font-bold">KPK4444 License Ready</h1>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">YOUR API KEY</span>
            <button onClick={copyKey} className="text-sm text-blue-400 hover:text-blue-300">{copied ? 'Copied!' : 'Copy Key'}</button>
          </div>
          <code className="text-xl text-green-400 break-all">{key}</code>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Installation Instructions for OJS</h2>
        <div className="space-y-4 text-gray-300">
          <p>Add these 2 lines exactly at the very top of your <code className="bg-gray-700 px-2 rounded">index.php</code>, right after <code className="bg-gray-700 px-2 rounded">&lt;?php</code>:</p>
          <pre className="bg-black p-4 rounded-lg overflow-x-auto text-sm text-blue-300 border border-gray-700">
            <code>
define('KPK4444_API_KEY', '{key}');{'\n'}
define('KPK4444_API_URL', 'https://kapuyuak.vercel.app');
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
