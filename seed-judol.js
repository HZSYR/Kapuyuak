const fs = require('fs');
const mongoose = require('mongoose');

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
let MONGODB_URI = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('MONGODB_URI=')) {
    MONGODB_URI = line.replace('MONGODB_URI=', '').trim();
    break;
  }
}

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in .env.local");
  process.exit(1);
}

const blacklistSchema = new mongoose.Schema({
  type: String,
  value: String,
  category: String,
  severity: String,
  addedBy: String
}, { timestamps: true });

const Blacklist = mongoose.models.Blacklist || mongoose.model('Blacklist', blacklistSchema);

const judolCritical = [
  "slot online", "judi online", "situs judi", "agen slot", "judi bola", "bandar togel", 
  "dominoqq", "capsa susun", "sabung ayam online", "sbobet", "joker123", "pragmatic play", 
  "pg soft", "pgsoft", "maxwin", "slotgacor", "slot88", "togel macau", "togel hongkong", 
  "situs slot", "link slot", "daftar slot", "login slot", "rtp slot", "bocoran slot", 
  "pola slot", "slot gacor", "judionline", "judi slot", "bandar slot", "agen judi", "bandar judi",
  "link alternatif", "anti rungkad", "slot resmi", "slot terpercaya", "deposit pulsa",
  "tanpa potongan", "pasti jp", "gampang menang"
];

const judolHigh = [
  "gacor", "togel", "casino", "taruhan", "poker", "baccarat", "roulette", "jackpot", 
  "scatter", "depo", "sensational", "rungkad", "habanero", "spadegaming", "cq9", "sicbo", 
  "bandarq", "mix parlay", "sv388", "s128", "tembak ikan", "dingdong", "paito warna", 
  "live draw", "syair togel"
];

const judolMedium = [
  "petir", "zeus", "olympus", "mahjong", "kakek", "bonanza", "maxbet", "qris", "dana", "ovo", "gopay", "nawala"
];

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected. Fetching existing keywords...");
    
    const existing = await Blacklist.find({ type: 'keyword' });
    const existingSet = new Set(existing.map(e => e.value.toLowerCase()));
    
    let toInsert = [];
    
    const addList = (list, severity) => {
      for (const word of list) {
        if (!existingSet.has(word.toLowerCase())) {
          toInsert.push({
            type: 'keyword',
            value: word,
            category: 'SPAM_CONTENT',
            severity: severity,
            addedBy: 'system'
          });
          existingSet.add(word.toLowerCase());
        }
      }
    };
    
    addList(judolCritical, 'CRITICAL');
    addList(judolHigh, 'HIGH');
    addList(judolMedium, 'MEDIUM');
    
    if (toInsert.length > 0) {
      console.log(`Inserting ${toInsert.length} new gambling keywords...`);
      await Blacklist.insertMany(toInsert);
      console.log("Insertion complete!");
    } else {
      console.log("All keywords already exist in the database.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
    console.log("Done.");
  }
}

run();
