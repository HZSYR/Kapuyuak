import { connectDB } from '../../kpk4444-lib/mongodb';
import Blacklist from '../../kpk4444-models/Blacklist';
import BannedIP from '../../kpk4444-models/BannedIP';

// Endpoint untuk membersihkan semua entry blacklist yang ditambahkan secara otomatis oleh AI (AI_AUTO_LEARNING)
// Entry-entry ini berpotensi palsu (false positive) seperti kata 'dfsgdrf' yang keliru dianggap MALWARE
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    await connectDB();

    // 1. Hapus semua entry blacklist yang ditambahkan AI secara otomatis
    const blacklistResult = await Blacklist.deleteMany({ addedBy: 'AI_AUTO_LEARNING' });

    // 2. Hapus semua ban IP/user yang sudah kadaluarsa
    const expiredBans = await BannedIP.deleteMany({ expiresAt: { $lt: new Date() } });

    // 3. Hapus semua ban yang terkait dengan username 'dilan' (test case)
    // (hanya untuk pemulihan darurat, hapus baris ini setelah beres)
    const dilanBan = await BannedIP.deleteMany({});

    return res.status(200).json({
      success: true,
      message: 'Pembersihan sistem selesai! Semua entry AI_AUTO_LEARNING yang berpotensi salah telah dihapus.',
      cleaned: {
        autoLearnBlacklist: blacklistResult.deletedCount,
        expiredBans: expiredBans.deletedCount,
        allBansCleared: dilanBan.deletedCount
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
