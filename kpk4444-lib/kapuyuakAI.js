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
    // --- SPAM / JUDI ---
    { label: 'JUDI', text: 'situs slot gacor maxwin hari ini deposit pulsa tanpa potongan' },
    { label: 'JUDI', text: 'bocoran rtp slot zeus olympus paling akurat' },
    { label: 'JUDI', text: 'daftar judi bola sbobet casino online terpercaya' },
    { label: 'JUDI', text: 'link alternatif login joker123 pragmatic play pg soft' },
    { label: 'JUDI', text: 'bandar togel macau hongkong singapore sydney' },
    { label: 'JUDI', text: 'pasti jp gampang menang anti rungkad' },
    // --- HACK / MALWARE ---
    { label: 'HACK', text: 'ev' + 'al(bas' + 'e64_decode($_PO' + 'ST["cmd"]))' },
    { label: 'HACK', text: 'sys' + 'tem($_G' + 'ET["c"]);' },
    { label: 'HACK', text: 'she' + 'll_ex' + 'ec("ls -la");' },
    { label: 'HACK', text: 'UN' + 'ION SE' + 'LECT username, password FROM users --' },
    { label: 'HACK', text: 'DR' + 'OP TAB' + 'LE IF EXISTS sessions;' },
    { label: 'HACK', text: 'document.cookie fetch(http://hacker.com)' },
    // --- AMAN / NORMAL ACADEMIC ---
    { label: 'AMAN', text: 'Jurnal ini membahas tentang penelitian metode pengembangan sistem informasi.' },
    { label: 'AMAN', text: 'Abstrak: Penelitian ini menggunakan pendekatan kualitatif dan kuantitatif.' },
    { label: 'AMAN', text: 'Kata kunci: pendidikan, teknologi, masyarakat.' },
    { label: 'AMAN', text: 'Budi Hartono, Agus Setiawan, Joko Widodo' },
    { label: 'AMAN', text: 'Submit artikel jurnal melalui OJS open journal systems.' },
    { label: 'AMAN', text: 'Hasil dan Pembahasan dari pengabdian masyarakat.' },
    { label: 'AMAN', text: 'Daftar Pustaka, Referensi, Metodologi Penelitian.' }
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
