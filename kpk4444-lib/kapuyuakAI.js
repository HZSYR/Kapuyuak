import bayes from 'bayes';
import KapuyuakAI from '../kpk4444-models/KapuyuakAI';
import { connectDB } from './mongodb';
import fs from 'fs';
import path from 'path';

export function generateFlexibleLog(content, mlResult, domain, ip = 'unknown', username = 'unknown') {
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const identityStr = username !== 'unknown' ? `User ${username} [IP: ${ip}]` : `Guest [IP: ${ip}]`;

  if (mlResult === 'JUDI') {
    const p1 = ["Aksi terdeteksi!", "Peringatan keamanan!", "Sistem memantau anomali.", "Pemindaian selesai."];
    const p2 = ["Terdapat indikasi muatan promosi Perjudian (JUDOL)", "Sistem menangkap pola teks yang terkait dengan situs Judi Online", "Ditemukan struktur kalimat yang mempromosikan Judi/Slot", "Analisis mendeteksi adanya keyword SPAM Perjudian ilegal"];
    const p3 = [`dari ${identityStr} di domain ${domain}.`, `dikirim oleh ${identityStr} melalui ${domain}.`, `bersumber dari ${identityStr} pada target ${domain}.`];
    const p4 = ["Sistem keamanan telah melakukan pemblokiran instan.", "Koneksi diputus untuk menjaga integritas server.", "Akses ditolak secara permanen sesuai protokol.", "Tindakan isolasi langsung dieksekusi."];
    return `${getRandom(p1)} ${getRandom(p2)} ${getRandom(p3)} ${getRandom(p4)}`;
  } 
  else if (mlResult === 'HACK') {
    const p1 = ["Bahaya siber terdeteksi!", "Peringatan eksploitasi!", "Sistem Deep Learning menangkap anomali kritis.", "Aktivitas peretasan tertangkap."];
    const p2 = ["Payload teridentifikasi mengandung injeksi berbahaya (HACK)", "Ditemukan struktur kode eksploitasi dan upaya peretasan", "Analisis menemukan pola injeksi Web Shell / Malware", "Sistem mendeteksi muatan yang dirancang merusak sistem"];
    const p3 = [`dari ${identityStr} menuju ${domain}.`, `pada jalur koneksi ${domain} oleh ${identityStr}.`, `yang diluncurkan oleh ${identityStr} terhadap ${domain}.`];
    const p4 = ["Serangan berhasil dinetralisir dengan tegas.", "Pemblokiran keamanan langsung diaktifkan.", "Akses penyusup telah digagalkan sepenuhnya.", "Sistem langsung membuang payload tersebut."];
    return `${getRandom(p1)} ${getRandom(p2)} ${getRandom(p3)} ${getRandom(p4)}`;
  } 
  else {
    const p1 = ["Analisis mendalam selesai.", "Pengecekan Deep Learning rampung.", "Pemindaian payload berhasil.", "Verifikasi keamanan selesai."];
    const p2 = ["Teks dan struktur kalimat berstatus bersih", "Gaya bahasa dan parameter input dalam batas wajar", "Data yang dikirimkan terbukti valid", "Tidak ditemukan satupun pola ancaman siber"];
    const p3 = [`dari ${identityStr} ke ${domain}.`, `pada permintaan ${domain} oleh ${identityStr}.`, `untuk koneksi dari ${identityStr} tujuan ${domain}.`];
    const p4 = ["Akses sistem diizinkan sepenuhnya.", "Tidak ada ancaman, semuanya terkendali.", "Lalu lintas data aman untuk diproses OJS.", "Koneksi diizinkan masuk ke server."];
    return `${getRandom(p1)} ${getRandom(p2)} ${getRandom(p3)} ${getRandom(p4)}`;
  }
}


let classifier = null;

export async function getKapuyuakConfig() {
  await connectDB();
  let config = await KapuyuakAI.findOne({ configId: 'global_v2' });
  if (!config) {
    config = await KapuyuakAI.create({ configId: 'global_v2', activeEngine: 'GROQ' });
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
