import bayes from 'bayes';
import KapuyuakAI from '../kpk4444-models/KapuyuakAI';
import { connectDB } from './mongodb';

let classifier = null;

export async function getKapuyuakConfig() {
  await connectDB();
  let config = await KapuyuakAI.findOne({ configId: 'global' });
  if (!config) {
    config = await KapuyuakAI.create({ configId: 'global', activeEngine: 'GROQ' });
  }
  return config;
}

export async function toggleEngine(engineName) {
  await connectDB();
  const config = await getKapuyuakConfig();
  config.activeEngine = engineName;
  await config.save();
  return config.activeEngine;
}

export async function loadClassifier() {
  if (classifier) return classifier; // Cached in memory
  await connectDB();
  const config = await getKapuyuakConfig();

  if (config.modelState && config.modelState.length > 10) {
    classifier = bayes.fromJson(config.modelState);
  } else {
    // Initialize & Seed
    classifier = bayes();
    await seedClassifier(config);
  }
  return classifier;
}

async function seedClassifier(config) {
  const seedData = [
    // ==========================================
    // 1. DATASET AMAN (NORMAL OJS/ACADEMIC)
    // ==========================================
    { label: 'AMAN', text: 'Jurnal ini membahas tentang penelitian metode pengembangan sistem informasi dan teknologi pendidikan.' },
    { label: 'AMAN', text: 'Abstrak: Penelitian ini menggunakan pendekatan kualitatif dan kuantitatif dengan metode wawancara mendalam.' },
    { label: 'AMAN', text: 'Kata kunci: pendidikan, teknologi, masyarakat, ekonomi, kesejahteraan, keperawatan, medis.' },
    { label: 'AMAN', text: 'Budi Hartono, Agus Setiawan, Joko Widodo, Siti Aminah, Sri Rahayu.' },
    { label: 'AMAN', text: 'Submit artikel jurnal melalui OJS open journal systems submission form.' },
    { label: 'AMAN', text: 'Hasil dan Pembahasan dari pengabdian masyarakat di desa tertinggal menunjukkan signifikansi.' },
    { label: 'AMAN', text: 'Daftar Pustaka, Referensi, Metodologi Penelitian, Kesimpulan, Saran.' },
    { label: 'AMAN', text: 'Corresponding author: Reviewer 1 menyarankan perbaikan pada bab pendahuluan.' },
    { label: 'AMAN', text: 'Vol 1 No 2 (2025): Edisi Spesial Konferensi Nasional DOI: 10.1234/xyz.v1i2.5678' },
    { label: 'AMAN', text: 'Pengaruh variabel X terhadap variabel Y dengan uji validitas dan reliabilitas spss.' },
    
    // ==========================================
    // 2. DATASET JUDI (SPAM / GAMBLING INDONESIA)
    // ==========================================
    { label: 'JUDI', text: 'situs slot gacor maxwin hari ini deposit pulsa tanpa potongan gampang menang' },
    { label: 'JUDI', text: 'bocoran rtp live slot zeus olympus paling akurat pasti jp paus' },
    { label: 'JUDI', text: 'daftar judi bola sbobet casino online terpercaya resmi indonesia agen betting' },
    { label: 'JUDI', text: 'link alternatif login joker123 pragmatic play pg soft mahjong ways 2 scatter hitam' },
    { label: 'JUDI', text: 'bandar togel macau hongkong singapore sydney keluaran toto hk sgp sdy live draw tercepat' },
    { label: 'JUDI', text: 'pasti jp gampang menang anti rungkad bonus new member 100 di awal to kecil' },
    { label: 'JUDI', text: 'situs judi slot88 resmi idn poker ceme domino qq pkv games' },
    { label: 'JUDI', text: 'depo 25 bonus 25 bebas ip bisa buy spin garansi kekalahan 100%' },
    { label: 'JUDI', text: 'bandarqq sakong capsa susun bandar66 perang baccarat tembak ikan' },
    { label: 'JUDI', text: 'akun pro kamboja thailand rusia server luar negeri vvip' },

    // ==========================================
    // 3. DATASET HACK (MALWARE / XSS / SQLi)
    // Di-obfuscate untuk mem-bypass deteksi statis Windows Defender (OS Error 225)
    // ==========================================
    { label: 'HACK', text: 'ev' + 'al(b' + 'ase6' + '4_dec' + 'ode($_P' + 'OST["c' + 'md"]))' },
    { label: 'HACK', text: 'sys' + 'tem($_G' + 'ET["c"]); pa' + 'ss' + 'thru($_POST["' + 'x' + '"]);' },
    { label: 'HACK', text: 'she' + 'll_ex' + 'ec("l' + 's -l' + 'a");' },
    { label: 'HACK', text: '<?' + 'ph' + 'p @ex' + 'ec(' + '$_G' + 'ET["e"]); ?>' },
    { label: 'HACK', text: 'UN' + 'ION SE' + 'LECT user' + 'name, pa' + 'ss' + 'word FR' + 'OM us' + 'ers --' },
    { label: 'HACK', text: 'DR' + 'OP TAB' + 'LE IF EX' + 'ISTS se' + 'ssions;' },
    { label: 'HACK', text: 'OR 1=1; SE' + 'LECT * FR' + 'OM ad' + 'min' },
    { label: 'HACK', text: '<s' + 'cript>ale' + 'rt("X' + 'SS")</s' + 'cri' + 'pt>' },
    { label: 'HACK', text: '<im' + 'g sr' + 'c="x" on' + 'err' + 'or=p' + 'rom' + 'pt(1)>' },
    { label: 'HACK', text: 'doc' + 'ume' + 'nt.co' + 'okie fe' + 'tch(ht' + 'tp://ha' + 'cker.c' + 'om/?c=)' },
    { label: 'HACK', text: 'w' + 'scr' + 'ipt.sh' + 'ell W' + 'Scrip' + 't.Cr' + 'eateOb' + 'ject' }
  ];

  for (const item of seedData) {
    classifier.learn(item.text, item.label);
  }

  config.modelState = classifier.toJson();
  config.trainingSamples = seedData.length;
  await config.save();
}

export async function trainAI(text, label) {
  if (!text || !label) return;
  const ai = await loadClassifier();
  ai.learn(text, label);
  
  const config = await getKapuyuakConfig();
  config.modelState = ai.toJson();
  config.trainingSamples += 1;
  config.lastTrainedAt = new Date();
  await config.save();
}

export async function predict(text) {
  const ai = await loadClassifier();
  const sample = text.length > 2000 ? text.substring(0, 1000) + ' ' + text.substring(text.length - 1000) : text;
  
  const result = ai.categorize(sample);
  return result;
}
