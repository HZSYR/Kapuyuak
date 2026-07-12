import { connectDB } from '../../kpk4444-lib/mongodb';
import Blacklist from '../../kpk4444-models/Blacklist';

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

export default async function handler(req, res) {
  try {
    await connectDB();
    
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
      await Blacklist.insertMany(toInsert);
      return res.status(200).json({ success: true, message: `Successfully inserted ${toInsert.length} new online gambling keywords!`, newKeywords: toInsert.map(i => i.value) });
    } else {
      return res.status(200).json({ success: true, message: "All gambling keywords are already in the database." });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
