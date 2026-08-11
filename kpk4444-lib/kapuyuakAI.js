import bayes from 'bayes';
import KapuyuakAI from '../kpk4444-models/KapuyuakAI';
import { connectDB } from './mongodb';

let classifier = null;

export function resetClassifierMemory() {
    classifier = null;
}

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
