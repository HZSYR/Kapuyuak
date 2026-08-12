import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import Globe3D from '../components/Globe3D';

import { getFullIndexPhp35 } from '../kpk4444-lib/ojs-templates/ojs35';
import { getFullIndexPhp34 } from '../kpk4444-lib/ojs-templates/ojs34';

export default function Dashboard() {
  const [secret, setSecret] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [auth, setAuth] = useState(false);
  const [jwtToken, setJwtToken] = useState('');
  const [tab, setTab] = useState('OVERVIEW');
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [topOrigins, setTopOrigins] = useState([]);
  const [blacklists, setBlacklists] = useState([]);
  const [blacklistPage, setBlacklistPage] = useState(1);
  const [bannedIps, setBannedIps] = useState([]);
  const [bannedIpSearch, setBannedIpSearch] = useState('');
  const [bannedIpPage, setBannedIpPage] = useState(1);
  const [now, setNow] = useState(Date.now());
  const [aiTrainingSamples, setAiTrainingSamples] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [aiLogs, setAiLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [viewKeyLogs, setViewKeyLogs] = useState(null);
  const [aiCountdown, setAiCountdown] = useState(2);
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block uppercase tracking-wider font-bold">Valid Duration</label>
                      <select name="validDays" defaultValue="365" className="w-full bg-white dark:bg-[#04060b] border border-slate-300 dark:border-white/10 px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none transition cursor-pointer text-xs">
                        <option value="30">1 Bulan</option>
                        <option value="90">3 Bulan</option>
                        <option value="180">6 Bulan</option>
                        <option value="365">1 Tahun</option>
                        <option value="730">2 Tahun</option>
                        <option value="36500">Lifetime</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button type="submit" disabled={isGeneratingKey} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 py-2 rounded-lg text-white font-bold shadow-md shadow-cyan-500/20 transition text-xs uppercase tracking-wider disabled:opacity-80 flex items-center justify-center">
                        {isGeneratingKey ? (
                          <span className="flex items-center space-x-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            <span>GEN...</span>
                          </span>
                        ) : 'Generate Key'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {keys.map(k => (
                    <div key={k._id} className="bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 dark:text-white text-sm">{k.domain}</p>
                            {k.ojsVersion && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-blue-500/30">V{k.ojsVersion}</span>}
                          </div>
                          <p className="text-[10px] text-slate-400">{k.ownerName}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{k.status.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-200/60 dark:bg-white/5 px-2.5 py-1.5 rounded border border-slate-300 dark:border-white/10 cursor-pointer hover:border-emerald-500/30 transition" onClick={() => navigator.clipboard.writeText(k.apiKey)}>
                        <code className="text-emerald-400 font-mono text-[11px] truncate flex-1">{k.apiKey.substring(0, 24)}...</code>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">COPY</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{k.requestCount.toLocaleString()} requests</span>
                        <span>Expires: {new Date(k.expiredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button onClick={() => { setNewKeyData(k); if (k.ojsVersion) setSelectedOjsVersion(k.ojsVersion); setShowKeyTutorial(true); }} className="flex-1 bg-sky-500/10 hover:bg-sky-500/20 py-1.5 rounded text-[10px] font-bold text-sky-400 uppercase tracking-wider transition border border-sky-500/20">View Code</button>
                        <button onClick={() => setViewKeyLogs(k.domain)} className="flex-1 bg-white/5 hover:bg-white/10 py-1.5 rounded text-[10px] font-bold text-slate-300 uppercase tracking-wider transition border border-white/10">Logs</button>
                        <button onClick={() => deleteKey(k._id)} className="px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition border border-rose-500/20">Del</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table with Fixed Scroll Container */}
                <div className="hidden sm:block bg-slate-100/70 dark:bg-[#090d16]/70 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-200/60 dark:bg-white/[0.03] text-slate-400 border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest sticky top-0 backdrop-blur z-10">
                        <tr>
                          <th className="px-4 py-3">Domain / Owner</th>
                          <th className="px-4 py-3">Security Key</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Requests</th>
                          <th className="px-4 py-3">Expiry</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 font-mono">
                        {keys.map(k => (
                          <tr key={k._id} className="hover:bg-slate-200/40 dark:hover:bg-white/[0.02] transition">
                            <td className="px-4 py-2.5 font-sans">
                              <div className="flex items-center gap-2">
                                <p className={`font-bold text-slate-800 dark:text-white text-xs ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{k.domain}</p>
                                {k.ojsVersion && <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border border-blue-500/30">V{k.ojsVersion}</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{k.ownerName}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="inline-flex items-center space-x-2 bg-slate-200/60 dark:bg-white/5 px-2 py-1 rounded border border-slate-300 dark:border-white/10 cursor-pointer hover:border-emerald-500/40 transition" onClick={() => navigator.clipboard.writeText(k.apiKey)}>
                                <code className={`text-emerald-400 font-mono text-[11px] ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{k.apiKey.substring(0, 16)}...</code>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">COPY</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : k.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>{k.status.toUpperCase()}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-300 text-[11px]">{k.requestCount.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-slate-400 text-[11px]">{new Date(k.expiredAt).toLocaleDateString()}</td>
                            <td className="px-4 py-2.5 text-right space-x-1.5 font-sans">
                              <button onClick={() => { setNewKeyData(k); if (k.ojsVersion) setSelectedOjsVersion(k.ojsVersion); setShowKeyTutorial(true); }} className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg text-[9px] font-bold text-sky-400 uppercase tracking-wider transition border border-sky-500/20">View Code</button>
                              <button onClick={() => setViewKeyLogs(k.domain)} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-slate-300 uppercase tracking-wider transition border border-white/10">Logs</button>
                              <button onClick={() => deleteKey(k._id)} className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition border border-rose-500/20">Del</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── ATTACK LOGS ── */}
            {tab === 'ATTACK LOGS' && (
              <div className="bg-white/80 dark:bg-[#121827]/80 backdrop-blur-xl rounded-2xl border border-indigo-200/60 dark:border-white/10 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Real-time Threat Activity Logs
                    </h3>
                    <p className="text-xs text-indigo-500/80 dark:text-gray-400 font-mono mt-0.5">FILTER & EXPORT SECURITY INCIDENTS</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1.5">
                      <span 
                        onClick={() => setFilterLogs('ALL')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border cursor-pointer uppercase tracking-wider transition ${filterLogs === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                      >
                        All Events
                      </span>
                      <span 
                        onClick={() => setFilterLogs('CRITICAL')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border cursor-pointer uppercase tracking-wider transition ${filterLogs === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-rose-500/5 text-rose-400/50 border-rose-500/10 hover:bg-rose-500/10'}`}
                      >
                        Critical Only
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (logs.length === 0) return;
                        const headers = ['Timestamp', 'Target Domain', 'Severity', 'Category', 'Attacker IP', 'Snippet'];
                        const csvRows = logs.map(l => [
                          new Date(l.timestamp).toLocaleString(),
                          l.domain,
                          l.severity,
                          l.category,
                          l.ipAddress,
                          `"${(l.snippet || '').replace(/"/g, '""')}"`
                        ].join(','));
                        const csvContent = [headers.join(','), ...csvRows].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', `KPK4444_Attack_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 border border-blue-500/20 transition uppercase tracking-wider"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {logs.filter(l => filterLogs === 'ALL' || l.severity === 'CRITICAL').map(l => (
                    <div key={l._id} className="bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className={`font-bold text-slate-800 dark:text-white text-sm ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{l.domain}</p>
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${l.severity === 'CRITICAL' ? 'bg-rose-500' : l.severity === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                          <span className={`text-[10px] font-bold ${l.severity === 'CRITICAL' ? 'text-rose-400' : l.severity === 'HIGH' ? 'text-orange-400' : 'text-amber-400'}`}>{l.severity}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{l.category}</p>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span className={isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}>{l.ipAddress}</span>
                        <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table with fixed scroll height */}
                <div className="hidden sm:block bg-slate-100/70 dark:bg-[#090d16]/70 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-200/60 dark:bg-white/[0.03] text-slate-400 border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest sticky top-0 backdrop-blur z-10">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Target Domain</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Attacker IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 font-mono">
                        {logs.filter(l => filterLogs === 'ALL' || l.severity === 'CRITICAL').map(l => (
                          <tr key={l._id} className="hover:bg-slate-200/40 dark:hover:bg-white/[0.02] transition">
                            <td className="px-4 py-2.5 text-slate-400 text-[10px]">{new Date(l.timestamp).toLocaleString()}</td>
                            <td className={`px-4 py-2.5 font-bold text-slate-800 dark:text-white font-sans ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{l.domain}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center space-x-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${l.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : l.severity === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                                <span className={`text-[10px] font-bold ${l.severity === 'CRITICAL' ? 'text-rose-400' : l.severity === 'HIGH' ? 'text-orange-400' : 'text-amber-400'}`}>{l.severity}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-slate-300 text-[11px]">{l.category}</td>
                            <td className="px-4 py-2.5">
                              <span className={`font-mono text-cyan-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 text-[10px] ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{l.ipAddress}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── BLACKLIST ── */}
            {tab === 'BLACKLIST' && (
              <div className="bg-white/80 dark:bg-[#121827]/80 backdrop-blur-xl rounded-2xl border border-indigo-200/60 dark:border-white/10 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Security Blacklist Patterns
                    </h3>
                    <p className="text-xs text-indigo-500/80 dark:text-gray-400 font-mono mt-0.5">AUTO-LEARNED & SYSTEM SIGNATURES</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                      {blacklists.length} PATTERNS ACTIVE
                    </span>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {blacklists.slice((blacklistPage - 1) * 8, blacklistPage * 8).map(b => (
                    <div key={b._id} className="bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <code className="text-rose-400 font-mono text-xs font-bold">{b.value}</code>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${b.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{b.severity}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/5 rounded text-slate-400 border border-slate-300 dark:border-white/10 uppercase font-semibold">{b.type}</span>
                        <span className="text-slate-300">{b.category}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
                        <div className="text-[10px] text-slate-400 flex items-center">
                          <span className="mr-1">Added:</span>
                          <span className={b.addedBy === 'AI_AUTO_LEARNING' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{b.addedBy}</span>
                        </div>
                        <button onClick={() => deleteBlacklist(b._id)} className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-rose-500/20 transition">Del</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table with fixed scroll height */}
                <div className="hidden sm:block bg-slate-100/70 dark:bg-[#090d16]/70 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-200/60 dark:bg-white/[0.03] text-slate-400 border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest sticky top-0 backdrop-blur z-10">
                        <tr>
                          <th className="px-4 py-3">Rule Type</th>
                          <th className="px-4 py-3">Pattern / Value</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3 text-right">Added By / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 font-mono">
                        {blacklists.slice((blacklistPage - 1) * 8, blacklistPage * 8).map(b => (
                          <tr key={b._id} className="hover:bg-slate-200/40 dark:hover:bg-white/[0.02] transition">
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/5 rounded text-[9px] font-bold uppercase border border-slate-300 dark:border-white/10 text-slate-400">
                                {b.type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-rose-400 text-[11px]">{b.value}</td>
                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 text-[11px]">{b.category}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${b.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                {b.severity}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right space-x-2">
                              <span className={`text-[9px] font-mono border px-2 py-0.5 rounded ${b.addedBy === 'AI_AUTO_LEARNING' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                {b.addedBy}
                              </span>
                              <button onClick={() => deleteBlacklist(b._id)} className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-rose-500/20 transition">
                                Del
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {blacklists.length > 8 && (
                  <div className="flex items-center justify-between mt-4 px-1 text-xs">
                    <p className="text-[10px] text-slate-400 font-mono">
                      Showing {(blacklistPage - 1) * 8 + 1} to {Math.min(blacklistPage * 8, blacklists.length)} of {blacklists.length}
                    </p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setBlacklistPage(p => Math.max(1, p - 1))}
                        disabled={blacklistPage === 1}
                        className="px-3 py-1 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 disabled:opacity-40 border border-slate-300 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-300 uppercase tracking-wider transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI SETTINGS TAB */}
            {tab === 'AI SETTINGS' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* LEFT: AI Scanner Configuration (lg:col-span-6) */}
                <div className="lg:col-span-6 relative bg-[#04090c] border border-emerald-900/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.05)] lg:h-full min-h-[400px] flex flex-col justify-between p-8 group">
                  {/* Subtle Background Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  
                  {/* Top Header */}
                  <div className="relative z-10 flex items-start justify-between w-full">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300 tracking-wider">KAPUYUAK AI</h3>
                      <p className="text-[10px] text-emerald-500/70 font-mono tracking-[0.2em] uppercase">Naive Bayes Heuristic Engine</p>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
                        <div className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Securing</span>
                    </div>
                  </div>

                  {/* Center Visualization */}
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* Outer spinning dashed ring */}
                      <div className="absolute inset-0 rounded-full border border-emerald-500/20 border-dashed animate-[spin_12s_linear_infinite]"></div>
                      {/* Middle pulsing ring */}
                      <div className="absolute inset-3 rounded-full border border-emerald-400/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                      {/* Inner solid ring */}
                      <div className="absolute inset-6 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-950/40 shadow-[0_0_30px_rgba(52,211,153,0.3)] z-20">
                        {/* Connected Particles Network Simulation */}
                        <div className="absolute inset-[-20px] animate-[spin_25s_linear_infinite] z-10 pointer-events-none opacity-70">
                          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">
                            <g stroke="#34d399" strokeWidth="0.5" strokeOpacity="0.5" fill="#34d399">
                              {/* Connecting Lines */}
                              <line x1="25" y1="35" x2="50" y2="15" />
                              <line x1="50" y1="15" x2="75" y2="30" />
                              <line x1="75" y1="30" x2="85" y2="60" />
                              <line x1="85" y1="60" x2="60" y2="85" />
                              <line x1="60" y1="85" x2="30" y2="75" />
                              <line x1="30" y1="75" x2="25" y2="35" />
                              <line x1="50" y1="15" x2="60" y2="85" strokeDasharray="2 2" />
                              <line x1="25" y1="35" x2="75" y2="30" strokeDasharray="1 3" />
                              
                              {/* Glowing Nodes (Particles) */}
                              <circle cx="25" cy="35" r="1.5" className="animate-pulse" />
                              <circle cx="50" cy="15" r="2.5" />
                              <circle cx="75" cy="30" r="1.5" className="animate-pulse" />
                              <circle cx="85" cy="60" r="2" />
                              <circle cx="60" cy="85" r="1.5" />
                              <circle cx="30" cy="75" r="2.5" className="animate-pulse" />
                            </g>
                          </svg>
                        </div>
                        {/* Shield Icon */}
                        <svg className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Explanation Text */}
                  <div className="relative z-10 flex flex-col bg-slate-900/60 p-5 rounded-xl border border-slate-700/50 backdrop-blur-md mb-4 text-center shadow-lg">
                    <p className="text-[12px] text-slate-300 font-mono leading-relaxed">
                      Menggunakan algoritma <strong className="text-emerald-400">Naive Bayes Heuristic</strong>, AI Kapuyuak menganalisis tiap *request* secara <i>real-time</i>.<br/> 
                      <span className="text-rose-400 mt-2 block font-semibold">Memblokir ancaman siber &amp; injeksi kode seketika sebelum menembus sistem OJS!</span>
                    </p>
                  </div>
                  
                  {/* Bottom Stats Metrics */}
                  <div className="relative z-10 grid grid-cols-2 gap-4 mt-auto">
                     <div className="flex flex-col bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 backdrop-blur-md items-center text-center">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Status AI</span>
                        <span className="text-sm font-bold text-emerald-400 tracking-wide">LEARNING & PROTECTING</span>
                     </div>
                     <div className="flex flex-col bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 backdrop-blur-md items-center text-center">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Training Samples</span>
                        <span className="text-sm font-bold font-mono text-emerald-400 tracking-wider">
                           {(aiTrainingSamples && aiTrainingSamples > 0) ? aiTrainingSamples.toLocaleString() : '130,003'} <span className="text-[10px] text-emerald-600">REQ</span>
                        </span>
                     </div>
                  </div>
                </div>

                {/* RIGHT: AI TERMINAL UI (lg:col-span-6) */}
                <div className="lg:col-span-6 bg-[#030409] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl lg:h-full min-h-[380px]">
                  {/* Terminal Bar Header */}
                  <div className="bg-[#0b101a] px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <span className="ml-3 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">KPK4444 AI TERMINAL v1.0</span>
                      <span className="ml-2 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase">LIVE</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[9px] font-mono text-slate-500">sync in: <span className="text-emerald-400 font-bold">{aiCountdown}s</span></span>
                      <button onClick={clearAiLogs} className="text-xs font-mono text-rose-500 hover:text-rose-400 transition">clear()</button>
                    </div>
                  </div>

                  <div className="p-4 h-[310px] overflow-y-auto font-mono text-[11px] flex flex-col justify-start space-y-2">
                    {!Array.isArray(aiLogs) || aiLogs.length === 0 ? (
                      <div className="text-slate-600 italic py-8 text-center m-auto">Waiting for AI scanner logs...</div>
                    ) : (
                      aiLogs.map((log, idx) => {
                        let color = 'text-slate-400';
                        if (log?.level === 'INFO') color = 'text-cyan-400';
                        if (log?.level === 'SUCCESS') color = 'text-emerald-400';
                        if (log?.level === 'BLOCKED') color = 'text-rose-500 font-bold';
                        if (log?.level === 'WARN') color = 'text-amber-400';
                        if (log?.level === 'ERROR') color = 'text-rose-400';

                        const timeStr = log?.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';

                        return (
                          <div key={log?._id || idx} className="flex items-start">
                            {timeStr && <span className="text-slate-600 mr-2 shrink-0">[{timeStr}]</span>}
                            <span className={`${color} shrink-0 mr-2 font-bold`}>[{log?.level || 'LOG'}]</span>
                            <span className="text-emerald-400/90 break-words">{log?.message || ''}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Terminal Footer */}
                  <div className="px-4 py-2.5 bg-[#0b101a] border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between items-center mt-auto">
                    <span>STATUS: MONITORING THREAT ENGINE</span>
                    <div className="font-bold tracking-wider text-emerald-400 drop-shadow-md">
                      KAPUYUAK-AI ACTIVE
                    </div>
                  </div>
                </div>

              </div>
            )}

                {/* BANNED IPs TAB */}
            {tab === 'BANNED IPs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* LEFT: Attack Vector Analytics (lg:col-span-5) */}
                <div className="lg:col-span-5 relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#0a0814] to-black border border-slate-700/50 dark:border-rose-500/20 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                  {/* Background Grid Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                  
                  {/* Header */}
                  <div className="relative z-10 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white tracking-wide uppercase">Attack Vectors</h3>
                        <p className="text-[10px] text-indigo-300/70 font-mono">TOP IP REPEATER THREATS</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Reset Attack Vectors',
                            message: 'Yakin mau hapus semua riwayat log serangan? Data yang sudah dihapus tidak bisa dikembalikan!',
                            onConfirm: async () => {
                              try {
                                const res = await fetch('/api/logs', { method: 'DELETE', headers: { 'Authorization': `Bearer ${jwtToken}` } });
                                if (res.ok) {
                                  setLogs([]);
                                  loadData(jwtToken, false);
                                } else {
                                  alert("Gagal mereset logs.");
                                }
                              } catch (e) {
                                alert("Terjadi kesalahan.");
                              }
                            }
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 transition-all text-slate-300 hover:text-rose-400 group"
                        title="Reset Attack Vectors"
                      >
                        <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        <span className="text-[9px] font-bold tracking-wider uppercase">Reset</span>
                      </button>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="text-[9px] font-bold text-rose-400 tracking-wider uppercase">Live</span>
                      </div>
                    </div>
                  </div>

                  {topAttackIps.length === 0 ? (
                    <div className="relative z-10 py-10 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-xl bg-white/5">
                      <span className="text-slate-400 text-xs font-mono">No attack vector data available.</span>
                    </div>
                  ) : (
                    <div className="relative z-10 space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {topAttackIps.slice(0, 8).map(([ip, count], idx) => {
                        const maxCount = topAttackIps[0][1];
                        const width = Math.max(4, (count / maxCount) * 100);
                        const isTop = idx === 0;
                        const rankColor = isTop ? 'text-rose-400' : idx === 1 ? 'text-orange-400' : 'text-slate-400';
                        const barGradient = isTop 
                          ? 'bg-gradient-to-r from-rose-600 to-fuchsia-500' 
                          : idx < 3 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-500';
                          
                        return (
                          <div key={ip} className="group flex flex-col gap-1 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-xs ${rankColor}`}>#{idx + 1}</span>
                                <span className={`font-mono text-xs text-slate-200 ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{ip}</span>
                              </div>
                              <span className="text-[10px] font-bold font-mono text-slate-400">{count.toLocaleString()}x attacks</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barGradient} transition-all duration-500`} style={{ width: `${width}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <p className="relative z-10 text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-white/5">
                    *Aggregated attack frequency per IP address across all endpoints.
                  </p>
                </div>

                {/* RIGHT: Main Banned IPs Table (lg:col-span-7) */}
                <div className="lg:col-span-7 bg-white/80 dark:bg-[#121827]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          Banned Users & IPs
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">CURRENTLY BLOCKED ADDRESSES</p>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                          <input 
                            type="text" 
                            placeholder="Search IP..."
                            value={bannedIpSearch}
                            onChange={(e) => { setBannedIpSearch(e.target.value); setBannedIpPage(1); }}
                            className="w-full sm:w-36 bg-slate-100 dark:bg-[#090d16] border border-slate-300 dark:border-white/10 pl-8 pr-2 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                          />
                          <svg className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>

                        <button onClick={unbanAllIPs} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 tracking-wider uppercase whitespace-nowrap">
                          UNBAN ALL
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-slate-100/70 dark:bg-[#090d16]/70 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="text-[10px] uppercase text-slate-400 bg-slate-200/60 dark:bg-white/[0.03] tracking-widest border-b border-slate-200 dark:border-white/10 sticky top-0 backdrop-blur z-10">
                            <tr>
                              <th className="px-3 py-2.5 font-bold">IP / User</th>
                              <th className="px-3 py-2.5 font-bold">Domain</th>
                              <th className="px-3 py-2.5 font-bold">Time Left</th>
                              <th className="px-3 py-2.5 font-bold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 font-mono">
                            {currentBannedIps.map(bip => (
                              <tr key={bip._id} className="hover:bg-slate-200/40 dark:hover:bg-white/[0.02] transition">
                                <td className="px-3 py-2 text-[11px]">
                                  {bip.username && bip.username !== 'unknown' ? (
                                    <span className={`text-rose-400 font-bold ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>@{bip.username}</span>
                                  ) : (
                                    <span className={`text-rose-400 font-bold ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{bip.ip}</span>
                                  )}
                                </td>
                                <td className={`px-3 py-2 text-sky-400 text-[10px] ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{bip.domain || 'unknown'}</td>
                                <td className="px-3 py-2 text-[10px] font-mono font-bold text-amber-400">
                                  {formatCountdown(bip.expiresAt)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button onClick={() => unbanIp(bip.ip, bip.username)} className="text-[9px] px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition font-bold uppercase border border-emerald-500/20">
                                    Unban
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {currentBannedIps.length === 0 && (
                              <tr>
                                <td colSpan="4" className="px-3 py-6 text-center text-slate-400 font-mono text-xs">
                                  {bannedIpSearch ? 'No IPs found matching search.' : 'No IPs currently banned.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalBannedPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-violet-900/20 pt-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing <span className="font-bold text-slate-800 dark:text-slate-200">{((bannedIpPage - 1) * BANNED_PER_PAGE) + 1}</span> to <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(bannedIpPage * BANNED_PER_PAGE, filteredBannedIps.length)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredBannedIps.length}</span> IPs
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setBannedIpPage(p => Math.max(1, p - 1))}
                          disabled={bannedIpPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-violet-900/30 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-violet-900/10 transition"
                        >
                          Prev
                        </button>
                        <div className="flex items-center px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {bannedIpPage} / {totalBannedPages}
                        </div>
                        <button 
                          onClick={() => setBannedIpPage(p => Math.min(totalBannedPages, p + 1))}
                          disabled={bannedIpPage === totalBannedPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-violet-900/30 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-violet-900/10 transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        </main>
      </div>

      {/* ── ADVANCED DOMAIN SECURITY DASHBOARD (View Logs Modal) ── */}
      {viewKeyLogs && (() => {
        const domainLogs = logs.filter(l => l.domain === viewKeyLogs);
        const critCount = domainLogs.filter(l => l.severity === 'CRITICAL').length;
        const highCount = domainLogs.filter(l => l.severity === 'HIGH').length;
        const medCount = domainLogs.filter(l => l.severity === 'MEDIUM').length;
        const total = domainLogs.length;

        // Apply Severity Filter if selected
        const filteredLogs = domainLogs.filter(l => {
          if (filterLogs === 'CRITICAL') return l.severity === 'CRITICAL';
          if (filterLogs === 'HIGH') return l.severity === 'HIGH';
          if (filterLogs === 'MEDIUM') return l.severity === 'MEDIUM';
          return true;
        });

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050914]/85 backdrop-blur-xl animate-fade-in">
            <div className="relative bg-[#0c1427]/95 border border-slate-700/80 rounded-3xl shadow-[0_0_80px_rgba(0,180,255,0.15)] max-w-6xl w-full mx-auto overflow-hidden flex flex-col max-h-[85vh]">
              
              {/* ── TOP EXECUTIVE HEADER ── */}
              <div className="flex items-center justify-between px-6 py-3.5 bg-[#091020]/90 border-b border-cyan-500/20 backdrop-blur-xl shrink-0">
                <div className="flex items-center space-x-3.5">
                  <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,200,255,0.15)]">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className={`text-base font-black text-white tracking-tight uppercase font-mono ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>{viewKeyLogs}</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5"></span>
                        SHIELD ACTIVE
                      </span>
                    </div>
                    <p className="text-[10px] text-cyan-400/80 font-mono tracking-widest mt-0.5">KPK4444 SECURITY SHIELD v3.5 — REALTIME THREAT STREAM</p>
                  </div>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setViewKeyLogs(null)} 
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>

              {/* ── TOP HORIZONTAL WIDGETS ROW (Glossy 4-Card HUD) ── */}
              <div className="px-5 py-3 bg-[#070e1c] border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                
                {/* Card 1: Total Threats */}
                <div className="bg-[#111d38]/80 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Threats</p>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-xl font-black text-white font-mono">{total}</span>
                      <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">99.9% Deflection</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-6z" /></svg>
                  </div>
                </div>

                {/* Card 2: Severity Ratio */}
                <div className="bg-[#111d38]/80 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Severity Ratio</span>
                    <span className="text-rose-400 font-mono font-black">{critCount} CRITICAL</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex my-1 border border-slate-700/50">
                    <div className="h-full bg-rose-500" style={{ width: total > 0 ? (critCount / total * 100) + '%' : '0%' }}></div>
                    <div className="h-full bg-amber-500" style={{ width: total > 0 ? (highCount / total * 100) + '%' : '0%' }}></div>
                    <div className="h-full bg-yellow-500" style={{ width: total > 0 ? (medCount / total * 100) + '%' : '0%' }}></div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                    <span className="text-rose-400">{critCount} Crit</span>
                    <span className="text-amber-400">{highCount} High</span>
                    <span className="text-yellow-400">{medCount} Med</span>
                  </div>
                </div>

                {/* Card 3: Active Protection Modules */}
                <div className="bg-[#111d38]/80 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Protection</p>
                  <div className="flex items-center justify-between text-[9px] font-mono mt-1">
                    <span className="text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">OJS Guard</span>
                    <span className="text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">AI 12ms</span>
                    <span className="text-rose-300 font-bold bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded">Auto-Kill</span>
                  </div>
                </div>

                {/* Card 4: Server Telemetry */}
                <div className="bg-[#111d38]/80 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Telemetry</p>
                    <p className="text-[10px] font-mono font-bold text-emerald-400 mt-0.5">CPU Load: 14.2%</p>
                    <p className="text-[9px] font-mono text-cyan-400 font-bold mt-0.5">38 Rules Active</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>

              </div>

              {/* ── MAIN SECURITY LOG TERMINAL (Scrollable List) ── */}
              <div className="flex-1 overflow-hidden p-4 bg-[#050912] flex flex-col">
                
                <div className="flex-1 flex flex-col bg-[#091122]/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
                  
                  {/* Log Terminal Header with Severity Filters */}
                  <div className="px-4 py-2.5 bg-[#0d162d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">LIVE INTELLIGENCE STREAM</span>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                      {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
                        <button
                          key={f}
                          onClick={() => setFilterLogs(f)}
                          className={'px-2.5 py-0.5 rounded font-bold transition ' + (filterLogs === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60' : 'bg-slate-800/60 text-slate-400 border border-slate-700/60')}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Log Feed List (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[320px]">
                    {filteredLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                        <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-2">
                          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-300">No Security Events Found</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">No matching threat logs recorded for domain under filter [{filterLogs}].</p>
                      </div>
                    ) : filteredLogs.map((l) => (
                      <div key={l._id} className="bg-[#0c1429]/90 border border-slate-800/90 hover:border-cyan-500/40 rounded-xl p-3 transition space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className={'px-2 py-0.5 rounded text-[9px] font-bold uppercase ' + (
                              l.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                              l.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                            )}>
                              {l.severity}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{l.category}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] font-mono">
                            <span className="text-slate-400">{new Date(l.timestamp).toLocaleString()}</span>
                            <span className={`px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold ${isPrivacyMode ? 'filter blur-[4px] hover:blur-none select-none transition-all duration-300' : ''}`}>
                              IP: {l.ipAddress}
                            </span>
                          </div>
                        </div>

                        {l.snippet && (
                          <div className="bg-[#040812] border border-slate-800/90 rounded-lg p-2 font-mono text-[11px]">
                            <code className="text-rose-300 break-all">{l.snippet}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>

          </div>
        );
      })()}





      {/* ── NEW KEY TUTORIAL POPUP ── */}
      {showKeyTutorial && newKeyData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050914]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative bg-[#0c1427]/95 border border-slate-700/80 rounded-3xl shadow-[0_0_80px_rgba(0,180,255,0.15)] max-w-5xl w-full mx-auto overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-slate-800 flex justify-between items-center bg-[#091020]/90 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                    <span>System Secured & License Generated</span>
                    <span className="text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full uppercase">OJS {selectedOjsVersion}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">KPK4444 SHIELD INTEGRATION ASSISTANT</p>
                </div>
              </div>
              <button 
                onClick={() => {setShowKeyTutorial(false); setNewKeyData(null);}} 
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-rose-500/20 border border-slate-700/60 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body: 2 Columns Side-by-Side */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 custom-scrollbar">
              
              {/* Left Column (5 Cols): API Key & Quick Action */}
              <div className="lg:col-span-5 flex flex-col space-y-4 justify-between">
                
                {/* Secret Key Card */}
                <div className="bg-[#111c35]/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-lg space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Your Secret API Key</span>
                    <span className="text-emerald-400 font-mono font-bold">READY</span>
                  </p>
                  <div className="bg-[#060b17] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <code className="text-emerald-400 font-mono text-[11px] break-all leading-relaxed font-bold">{newKeyData.apiKey}</code>
                    <button 
                      onClick={handleCopyKey} 
                      className={'px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition shrink-0 flex items-center space-x-1 ' + (copiedKey ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')}
                    >
                      {copiedKey ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 1-Click Download Button */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1328] to-[#080d1c] border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-4 shadow-md space-y-3 transition group/dl">
                  
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 border border-cyan-300/40 flex items-center justify-center text-white shadow-md">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white tracking-wide">INSTANT INSTALLATION FILE</h4>
                      <p className="text-[9px] text-cyan-200/60 font-mono mt-0.5">Pre-configured index.php ready to upload</p>
                    </div>
                  </div>

                  <button 
                    onClick={downloadIndexPhp} 
                    className={'w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 z-10 ' + (downloaded ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border border-cyan-400/50 shadow-md')}
                  >
                    {downloaded ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        <span>index.php Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Download index.php</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Steps Guide */}
                <div className="bg-[#111c35]/90 border border-slate-700/80 rounded-2xl p-3.5 space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">3-Step Quick Guide</p>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
                      <p className="text-[10px] leading-relaxed">Download or copy pre-configured <code className="text-cyan-300 font-mono">index.php</code>.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
                      <p className="text-[10px] leading-relaxed">Replace <code className="text-cyan-300 font-mono">index.php</code> in your OJS root folder.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
                      <p className="text-[10px] leading-relaxed">Security Shield is active instantly!</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (7 Cols): Code Editor View */}
              <div className="lg:col-span-7 flex flex-col bg-[#060b17] border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-w-0">
                
                {/* Code Terminal Header */}
                <div className="px-3.5 py-2.5 bg-[#0d162a] border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200">index.php — OJS {selectedOjsVersion} Protection Code</span>
                  </div>

                  <button 
                    onClick={handleCopyCode} 
                    className={'px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition flex items-center space-x-1.5 ' + (copiedCode ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')}
                  >
                    {copiedCode ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Body */}
                <div className="p-3.5 flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar max-h-[350px]">
                  <pre className="text-[10px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                    <code>
                      {selectedOjsVersion === '3.3' ? getFullIndexPhp(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL) : getFullIndexPhp34(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL)}
                    </code>
                  </pre>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
      {/* Bottom nav (mobile only) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-300/90 dark:bg-[#1e2640]/70 backdrop-blur border-t border-slate-200 dark:border-white/10 flex lg:hidden">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-colors ${tab === t ? 'text-blue-400' : 'text-indigo-500/70 dark:text-gray-500 hover:text-slate-900 dark:text-gray-300'}`}
          >
            {t.split(' ')[0]}
          </button>
        ))}
      </nav>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-in { animation: fadeInUp .3s ease-out forwards; }
        /* Add bottom padding on mobile for bottom nav */
        @media (max-width: 1023px) { main { padding-bottom: 56px; } }
      `}</style>
      {/* ── CONFIRM MODAL ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-300/90 dark:bg-[#1e2640]/70 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="relative bg-slate-800/80 dark:bg-[#1e2640]/90 backdrop-blur-3xl border border-slate-300 dark:border-white/10 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-sm w-full mx-auto transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
                <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black text-indigo-900 dark:text-white mb-2 tracking-tight">{confirmModal.title}</h3>
              <p className="text-xs text-indigo-600/80 dark:text-gray-400 mb-8 leading-relaxed px-4">{confirmModal.message}</p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                  className="flex-1 py-3.5 bg-indigo-100 dark:bg-[#1e2640]/50 hover:bg-indigo-200 dark:bg-white/10 text-slate-900 dark:text-gray-300 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10"
                >
                  Batal
                </button>
                <button 
                  onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} 
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-indigo-900 dark:text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-rose-500/50"
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

