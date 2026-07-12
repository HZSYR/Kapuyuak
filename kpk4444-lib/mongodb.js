import mongoose from 'mongoose';
import Blacklist from '../kpk4444-models/Blacklist';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function seedBlacklist() {
  const count = await Blacklist.countDocuments();
  if (count === 0) {
    const initialBlacklists = [
      ...['slot', 'gacor', 'togel', 'casino', 'jackpot', 'taruhan', 'poker', 'sbobet', 'bet', 'gambling', 'maxwin', 'scatter', 'pragmatic', 'pg soft', 'judi', 'bola', 'domino', 'qq', 'bandar', 'roulette', 'baccarat', 'slot88', 'rtp', 'deposit pulsa', 'tanpa potongan', 'situs judi', 'agen slot', 'link alternatif', 'login sbobet', 'daftar slot', 'joker123', 'spadegaming', 'habanero', 'cq9', 'microgaming', 'playtech', 'toto', 'macau', 'hongkong', 'singapore', 'sydney', 'keluaran', 'pengeluaran', 'prediksi', 'bocoran', 'pasti jp', 'gampang menang', 'anti rungkad', 'pola slot', 'jam hoki'].map(w => ({ type: 'keyword', value: w, category: 'SPAM_CONTENT', severity: 'HIGH', addedBy: 'system' })),
      ...['UNION SELECT', 'DROP TABLE', 'INSERT INTO', '--', ';', '1=1', 'OR 1', 'EXEC', 'CAST', 'CONVERT', 'WAITFOR DELAY', 'SLEEP('].map(w => ({ type: 'sqlpattern', value: w, category: 'SQL_INJECTION', severity: 'CRITICAL', addedBy: 'system' })),
      ...['slotgacor.com', 'judionline.net', 'bandarqq.info'].map(w => ({ type: 'domain', value: w, category: 'SUSPICIOUS_LINK', severity: 'HIGH', addedBy: 'system' }))
    ];
    await Blacklist.insertMany(initialBlacklists);
  }
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      await seedBlacklist();
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
