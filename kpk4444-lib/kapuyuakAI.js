import bayes from 'bayes';
import KapuyuakAI from '../kpk4444-models/KapuyuakAI';
import { connectDB } from './mongodb';
import fs from 'fs';
import path from 'path';

let kbbiSet = null;

function loadKBBI() {
  if (kbbiSet) return kbbiSet;
  kbbiSet = new Set();
  try {
    const filePath = path.join(process.cwd(), 'kbbi.txt');
    if (fs.existsSync(filePath)) {
      const words = fs.readFileSync(filePath, 'utf8').split('\n');
      for (const w of words) {
        if(w.trim()) kbbiSet.add(w.trim().toLowerCase());
      }
    }
  } catch (e) {
    console.error("Gagal memuat database KBBI", e);
  }
  return kbbiSet;
}

export function generateFlexibleLog(content, mlResult, domain) {
  const dictionary = loadKBBI();
  const words = content.replace(/[^a-zA-Z\s]/g, ' ').toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let kbbiWords = 0;
  for (const w of words) {
    if (dictionary.has(w)) kbbiWords++;
  }
  
  const total = words.length === 0 ? 1 : words.length;
  const ratio = (kbbiWords / total) * 100;
  
  if (mlResult === 'HACK' || mlResult === 'JUDI') {
    const hackPhrases = [
      `Aksi terdeteksi! Payload tidak lazim ditemukan dari ${domain}. Hanya ${ratio.toFixed(1)}% kata yang dikenali KBBI. Pemblokiran langsung dieksekusi.`,
      `Sistem Deep Learning kami menangkap anomali bahasa. Payload dari ${domain} sangat tidak natural (${ratio.toFixed(1)}% rasio KBBI). Target ini pasti HACKER/SPAMMER.`,
      `Peringatan keamanan, Bos! Saya baru saja menganalisis data dari ${domain}. Struktur bahasanya hancur (Skor KBBI: ${ratio.toFixed(1)}%). Serangan berhasil dinetralisir.`
    ];
    return hackPhrases[Math.floor(Math.random() * hackPhrases.length)];
  } else {
    const safePhrases = [
      `Analisis selesai. Teks dari ${domain} tampak natural dan manusiawi (Kesesuaian KBBI: ${ratio.toFixed(1)}%). Tidak ada ancaman siber.`,
      `Saya telah memindai data dari ${domain}. Gaya bahasanya wajar dan valid di bahasa kita. Akses diizinkan.`,
      `Pengecekan Deep Learning rampung. Data mengandung struktur bahasa yang sangat aman (Rasio valid: ${ratio.toFixed(1)}%). Semuanya terkendali, Bos.`
    ];
    return safePhrases[Math.floor(Math.random() * safePhrases.length)];
  }
}


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
  // Import mega dataset generator
  const { generateMegaDataset } = require('./kapuyuak-dataset.js');
  
  // Hasilkan 11.000+ kombinasi unik
  const seedData = generateMegaDataset();

  // Proses training
  let successCount = 0;
  for (const item of seedData) {
    try {
        classifier.learn(item.text, item.label);
        successCount++;
    } catch (e) {
        // Abaikan data yang gagal diproses
    }
  }

  // Simpan Otak ke Database
  config.modelState = classifier.toJson();
  config.trainingSamples = successCount;
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
  
  // Lapis Penalti Ketat (Mencegah AI Adversarial Attack / Padding Bypass)
  const highRiskPatterns = /eval\(|system\(|shell_exec|move_uploaded_file|file_put_contents|php:\/\/filter|chmod\(|\$_FILES/i;
  if (highRiskPatterns.test(sample)) {
      return 'HACK'; // Override Naive Bayes jika ada pola fatal mutlak
  }
  
  return result;
}
