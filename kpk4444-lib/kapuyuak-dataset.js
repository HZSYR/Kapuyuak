// =========================================================================
// 🧠 KAPUYUAK AI MEGA DATASET GENERATOR (10,000+ SAMPLES)
// =========================================================================

// Kamus Pengetahuan Aman (OJS & Akademik)
const amanSubjects = [
    "Jurnal ini", "Penelitian", "Abstrak", "Studi kasus", "Metodologi", "Artikel", "Publikasi", "Naskah", "Reviewer", "Penulis utama", "Pengabdian masyarakat", "Eksperimen", "Data kualitatif", "Data kuantitatif", "Tinjauan pustaka",
    "Penulis pertama", "Koresponden", "Tim peneliti", "Dosen pembimbing", "Mahasiswa S2", "Doktor", "Profesor",
    "Makalah konferensi", "Tesis", "Disertasi", "Laporan penelitian", "Buku ajar", "Modul pembelajaran", "Prosiding", "Policy brief",
    "Universitas", "Lembaga penelitian", "Fakultas", "Program studi", "Komite etik", "Dewan redaksi",
    "Hipotesis", "Variabel bebas", "Variabel terikat", "Populasi penelitian", "Sampel", "Instrumen penelitian", "Kuesioner", "Wawancara mendalam",
    "Penulis kedua", "Penulis ketiga", "Editor in chief", "Managing editor", "Section editor", "Pembaca", "Akademisi", "Praktisi", "Asisten peneliti", "Pakar"
];

const amanVerbs = [
    "membahas tentang", "meneliti", "mengkaji ulang", "menganalisis", "menyimpulkan", "membandingkan", "mensubmit", "merevisi", "merekomendasikan", "menguji coba", "menjelaskan", "melaporkan hasil", "menggambarkan",
    "mengidentifikasi", "mengukur", "mengembangkan", "mengimplementasikan", "mengevaluasi", "memvalidasi", "menginterpretasikan", "mendokumentasikan",
    "merumuskan masalah", "menetapkan tujuan", "menentukan populasi", "memilih sampel", "mengolah data", "mempresentasikan hasil",
    "me-review", "mengindeks", "mendistribusikan", "mempublikasikan", "mengarsipkan", "mensitasi",
    "submitted", "accepted", "rejected", "under review", "in press", "published online",
    "menelaah", "menyelidiki", "mengeksplorasi", "mendesain", "mensimulasikan", "mengkompilasi", "merangkum", "mengkategorikan"
];

const amanObjects = [
    "sistem informasi", "teknologi pendidikan", "metode pembelajaran", "ekonomi makro", "keperawatan medis", "kesehatan masyarakat", "open journal systems", "pengembangan software", "analisis statistik spss", "validitas dan reliabilitas", "kebijakan publik", "dampak sosial", "daftar pustaka", "referensi akademik",
    "kualitas hidup pasien", "angka kematian ibu", "prevalensi diabetes", "imunisasi anak", "kesehatan mental remaja",
    "hasil belajar siswa", "literasi digital", "kurikulum merdeka", "pendidikan inklusif", "e-learning",
    "machine learning", "deep learning", "natural language processing", "IoT", "blockchain", "cloud computing", "cybersecurity",
    "kemiskinan", "ketimpangan gender", "migrasi", "urbanisasi", "perubahan iklim",
    "inflasi", "pertumbuhan ekonomi", "UMKM", "investasi asing", "ekspor impor",
    "regresi linear berganda", "uji t independen", "ANOVA", "structural equation modeling", "grounded theory", "fenomenologi", "studi literatur sistematis",
    "kecerdasan buatan", "big data", "data mining", "kriptografi", "jaringan komputer", "sistem terdistribusi", "rekayasa perangkat lunak", "interaksi manusia komputer", "augmented reality", "virtual reality",
    "manajemen strategis", "akuntansi keuangan", "pemasaran digital", "perilaku konsumen", "manajemen sumber daya manusia"
];

const amanKeywords = [
    "DOI: 10.1234/", "Vol 1 No 2 (2025)", "ISSN", "e-ISSN", "Peer-reviewed", "Open Access", "Scopus indexed", "Sinta 2", "Corresponding author", "Under review", "Accepted for publication",
    "DOI: 10.1016/", "DOI: 10.3390/", "DOI: 10.1007/",
    "WoS indexed", "DOAJ", "Crossref", "Google Scholar", "Garuda", "Sinta 1", "Sinta 3", "Sinta 4",
    "Revised and resubmitted", "Final proof", "Early access", "Retracted",
    "submission ID", "review round", "editorial decision", "galley proof", "layout editor",
    "Creative Commons", "CC-BY", "Plagiarism check", "Turnitin", "Mendeley", "Zotero", "EndNote", "Citation index", "Impact factor", "H-index"
];

const amanOjsEnglish = [
    "test", "testing", "submission", "guidelines", "title", "privacy statement", "consent", "checklist", "I agree to have my data collected", "previously published", "references", "upload", "file", "document", "pdf", "docx", "application/json", "true", "false", "null", "undefined", "session", "token", "requirements", "author", "article", "begin submission",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "01",
    "firstName", "lastName", "affiliation", "country", "orcid", "biography", "email", "phone",
    "submissionFile", "fileStage", "genreId", "uploaderUserId",
    "stageId", "submissionId", "reviewAssignmentId", "workflowStageId",
    "Content-Type", "multipart/form-data", "boundary", "charset=utf-8",
    "copyediting", "production", "scheduling", "publishing", "archive",
    "comments for the editor", "competing interests", "acknowledgements", "funding", "data availability",
    "dashboard", "profile", "tasks", "notifications", "administration", "settings", "website", "workflow", "distribution", "users & roles",
    // OJS Submission form checklist phrases (COMMON FALSE POSITIVE SOURCES)
    "This submission meets the requirements outlined in the Author Guidelines",
    "This submission has not been previously published nor is it before another journal for consideration",
    "All references have been checked for accuracy and completeness",
    "All tables and figures have been numbered and labeled",
    "Permission has been obtained to publish all photos datasets and other material",
    "Yes my submission meets all of these requirements",
    "Once you begin you can save your submission and come back to it later",
    "You will be able to review and correct any information before you submit",
    "Back to Submissions", "Save and continue", "Privacy Consent", "Submission Checklist",
    "I consent to have the data in this article processed",
    "abstract keywords introduction methodology results discussion conclusion",
    "literature review theoretical framework research design data collection",
    "peer review double blind single blind open review editorial board",
    "corresponding author email affiliation institution department",
    "volume issue pages year publisher journal name",
    "Plagiarism free original work ethical approval informed consent"
];

// Kamus Pengetahuan Judol (Gambling Spam)
const judolPrefix = [
    "situs", "link alternatif", "daftar", "login", "bocoran", "bandar", "agen", "situs resmi", "link", "info", "pola", "trik", "grup telegram", "kumpulan", "rekomendasi", "vip", "rtp", "bocoran admin",
    "s1tus", "l1nk", "d4ftar", "l0g1n", "b0c0ran",
    "cek", "klik", "join", "daftar sekarang", "mainkan", "coba", "akses", "buka",
    "admin", "CS 24 jam", "agen resmi", "official", "pusat",
    "whatsapp", "telegram", "instagram", "tiktok", "youtube",
    "gaskan", "buruan", "jangan lewatkan", "segera", "buktikan", "gabung", "cuan", "panen"
];

const judolGames = [
    "slot gacor", "rtp live olympus", "judi bola sbobet", "casino online terpercaya", "togel macau hongkong singapore sydney", "idn poker ceme domino qq", "mahjong ways 2 scatter hitam", "tembak ikan", "baccarat", "sabung ayam", "joker123 pragmatic play pg soft", "slot88", "pkv games", "bandarqq", "capsa susun", "starlight princess", "zeus x500", "scatter pink", "gates of olympus", "spaceman", "sweet bonanza",
    "slot777", "pesta4d", "gacor88", "maxwin99", "jp77", "sultan99", "hoki88", "jackpot123",
    "habanero", "microgaming", "rtg", "evo gaming", "sexy gaming",
    "lucky neko", "koi gate", "wild west gold", "book of dead", "mustang gold", "wolf gold",
    "dewa olympus", "kakek zeus", "petir merah zeus", "olympus 1000",
    "togel online", "4d 3d 2d", "colok bebas", "colok naga", "shio togel",
    "roulette", "sicbo", "dragon tiger", "blackjack", "slot pulsa", "judi online", "taruhan bola", "mix parlay"
];

const judolBait = [
    "maxwin hari ini", "pasti jp paus", "anti rungkad", "deposit pulsa tanpa potongan", "gampang menang", "bonus new member 100 di awal", "depo 25 bonus 25", "bebas ip", "bisa buy spin", "garansi kekalahan 100%", "to kecil", "server kamboja thailand rusia luar negeri vvip", "withdraw milyaran", "modal receh", "jackpot miliaran", "wd berapapun dibayar lunas", "bocoran admin jarwo", "pola gacor", "auto wd", "gampang pecah",
    "bonus deposit harian", "cashback 10%", "rollingan 0.5%", "turnover rendah", "freespin gratis",
    "promo terbatas", "hari ini saja", "limited slot", "daftar sekarang sebelum penuh",
    "member baru menang 50 juta", "pemain lama wd tiap hari", "sudah terbukti",
    "WA: 08xxx", "hubungi CS:", "klik link bio",
    "pasti bayar", "terpercaya sejagad", "bikin kaya", "auto sultan", "modal 10k", "deposit 5000", "tanpa potongan", "pasti withdraw", "langsung cair"
];

// Kamus Pengetahuan Hack (Malware / XSS / SQLi / Path Traversal / Command Injection)
// SEMUANYA DIOBFUSCATE UNTUK MENGHINDARI DETEKSI WINDOWS DEFENDER SAAT KOMPILASI
const hackActions = [
    'ev' + 'al(b' + 'ase6' + '4_dec' + 'ode(',
    'sys' + 'tem(',
    'she' + 'll_ex' + 'ec(',
    'pa' + 'ss' + 'thru(',
    '<?' + 'ph' + 'p @ex' + 'ec(',
    'UN' + 'ION SE' + 'LECT ',
    'DR' + 'OP TAB' + 'LE ',
    '<s' + 'cript>a' + 'lert(',
    '<im' + 'g sr' + 'c="x" on' + 'err' + 'or=',
    'doc' + 'ume' + 'nt.co' + 'okie ',
    'w' + 'scr' + 'ipt.sh' + 'ell',
    '../' + '../' + '../et' + 'c/pa' + 'sswd',
    '1; l' + 's -l' + 'a',
    'x' + 'ml e' + 'xt' + 'ern' + 'al en' + 'tity',
    'ba' + 'sh -i >& /' + 'dev/tc' + 'p/',
    'X' + 'MLHt' + 'tpReq' + 'uest',
    'f' + 'etc' + 'h(',
    'win' + 'dow.lo' + 'cati' + 'on=',
    'j' + 'avas' + 'cript:',
    'm' + 'ove_up' + 'load' + 'ed_fi' + 'le(',
    'f' + 'ile_p' + 'ut_c' + 'onte' + 'nts(',
    '$_F' + 'ILES[',
    'g' + 'zinf' + 'late(ba' + 'se6' + '4_dec' + 'ode(',
    's' + 'tr_ro' + 't13(',
    'c' + 'url_e' + 'xec(',
    'f' + 'ile_g' + 'et_c' + 'onte' + 'nts(',
    'p' + 'hp://' + 'input',
    'a' + 'ss' + 'ert(',
    'c' + 'reate' + '_fun' + 'ctio' + 'n(',
    'p' + 'hp://' + 'filter/c' + 'onve' + 'rt.i' + 'con' + 'v.',
    '{ph' + 'p}s' + 'yste' + 'm({/p' + 'hp}',
    'e' + 'xif_' + 'read' + '_da' + 'ta(',
    '__h' + 'alt_c' + 'omp' + 'ile' + 'r()',
    'p' + 'har:' + '//',
    's' + 'pli' + 'ce(',
    'a' + 'rray_m' + 'ap("s' + 'yst' + 'em"',
    
    // PHP Webshell variations
    'p' + 'roc_' + 'open(',
    'po' + 'pen(',
    'p' + 'cntl' + '_exec(',
    'ob_' + 'start(',
    
    // Template Injection (SSTI)
    '{{7*' + '7}}',
    '{%i' + 'mport' + ' os%}',
    '${7' + '*7}',
    '#{7' + '*7}',
    
    // XXE (XML External Entity)
    '<!DO' + 'CTYPE' + ' foo [',
    '<!EN' + 'TITY' + ' xxe',
    'SYS' + 'TEM "' + 'file:',
    
    // SSRF (Server-Side Request Forgery)
    'htt' + 'p://1' + '27.0.' + '0.1/',
    'htt' + 'p://0' + '.0.0.' + '0/',
    'htt' + 'p://m' + 'etada' + 'ta.aw' + 's/',
    'fi' + 'le://' + '/etc/',
    
    // Deserialisasi
    'O:8' + ':"Exp' + 'loits"',
    'uns' + 'eria' + 'lize(',
    '_un' + 'seria' + 'lize(',
    
    // Log4Shell / Log4j
    '${jn' + 'di:ld' + 'ap://',
    '${${' + 'low' + 'er:j}' + 'ndi:',
    
    // Reverse Shell variations
    'pyt' + 'hon3 ' + '-c "i' + 'mport',
    'nc -' + 'e /bi' + 'n/sh',
    'pow' + 'ersh' + 'ell -' + 'enc',
    
    // JWT Manipulation
    'alg' + '":"n' + 'one"',
    'HS2' + '56","' + 'none"'
];

const hackTargets = [
    '$_P' + 'OST["c' + 'md"]',
    '$_G' + 'ET["e"]',
    '$_R' + 'EQUEST["x"]',
    'user' + 'name, pa' + 'ss' + 'word FR' + 'OM us' + 'ers --',
    'IF EX' + 'ISTS se' + 'ssions;',
    '"X' + 'SS")',
    'p' + 'rom' + 'pt(1)',
    'fe' + 'tch(ht' + 'tp://ha' + 'cker.c' + 'om/?c=)',
    'W' + 'Scrip' + 't.Cr' + 'eateOb' + 'ject',
    'wi' + 'ndow.lo' + 'cat' + 'ion=',
    'tmp' + '_na' + 'me',
    '/' + 'var/t' + 'mp/',
    'u' + 'rld' + 'eco' + 'de(',
    'ch' + 'mo' + 'd(',
    '07' + '77',
    'b' + 'ase6' + '4_e' + 'nco' + 'de(',
    '16' + '9.25' + '4.16' + '9.25' + '4',
    'fi' + 'le.p' + 'har',
    's' + 'hell.p' + 'ht',
    'l' + 'oc' + 'alh' + 'ost:2' + '2',
    'd' + 'a' + 'ta://t' + 'ext/p' + 'lai' + 'n;b' + 'as' + 'e64',
    '.a' + 'ws/cr' + 'eden' + 'tials',
    
    // Path Traversal targets
    '/../' + '../' + 'wind' + 'ows/s' + 'ystem' + '32/',
    '/pro' + 'c/se' + 'lf/e' + 'nvir' + 'on',
    '/etc' + '/sha' + 'dow',
    'C:\\' + 'Win' + 'dows' + '\\Sys' + 'tem32',
    
    // Credential files
    '/.ss' + 'h/id' + '_rsa',
    '/.gi' + 'tcon' + 'fig',
    '/.en' + 'v',
    '/app' + '/con' + 'fig.' + 'php',
    
    // Database targets
    'infor' + 'mati' + 'on_sc' + 'hema' + '.tab' + 'les',
    'sys.' + 'syso' + 'bjec' + 'ts',
    'pg_s' + 'leep(' + '10)',
    'WAI' + 'TFOR ' + 'DELA' + 'Y',
    
    // XSS targets modern
    '</ti' + 'tle><' + 'svg/o' + 'nload',
    '"><' + 'svg o' + 'nloa' + 'd=',
    'java' + 'scrip' + 't:vo' + 'id(0)'
];

const ambiguSubjects = [
    "Penelitian tentang keamanan siber", "Jurnal kriminologi perjudian", 
    "Studi tentang SQL injection", "Artikel tentang cybercrime",
    "Analisis malware", "Paper tentang phishing awareness",
    "Riset tentang dampak judi online", "Kebijakan anti-perjudian",
    "Laporan kepolisian tentang judol", "Penelitian forensik digital"
];
const ambiguContexts = [
    "dalam konteks akademik", "untuk tujuan edukasi", "sebagai bahan ajar",
    "dari perspektif hukum", "dalam tinjauan sistematis", "sebagai studi kasus"
];

// Helper: Ambil elemen acak dari array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper Augmentasi
function addTypo(text) {
    if (Math.random() > 0.3) return text;
    const i = Math.floor(Math.random() * (text.length - 1));
    return text.substring(0, i) + text.charAt(i+1) + text.charAt(i) + text.substring(i+2);
}

function randomCase(text) {
    const rand = Math.random();
    if (rand < 0.2) return text.toUpperCase();
    if (rand < 0.4) return text.toLowerCase();
    return text;
}

function unicodeSpoof(text) {
    if (Math.random() > 0.3) return text;
    return text.replace(/a/g, 'ɑ').replace(/e/g, '℮');
}

function addHiddenSpace(text) {
    if (Math.random() > 0.3) return text;
    return text.replace(/ /g, ' \u200B');
}

// Fungsi Utama: Generate Dataset
export function generateMegaDataset() {
    const dataset = [];

    // --- 1. GENERATE AMAN DATA (Target ~55000 — lebih banyak dari JUDI untuk mengurangi false positive) ---
    for (let i = 0; i < 55000; i++) {
        let text = `${getRandom(amanSubjects)} ${getRandom(amanVerbs)} ${getRandom(amanObjects)}.`;
        if (Math.random() > 0.5) text += ` [${getRandom(amanKeywords)}]`;
        if (Math.random() > 0.4) text += ` ${getRandom(amanOjsEnglish)} ${getRandom(amanOjsEnglish)}`;
        
        text = addTypo(text);
        text = randomCase(text);
        dataset.push({ label: 'AMAN', text });
    }

    // --- 2. GENERATE JUDOL DATA (Target ~30000 — dikurangi dari 40k untuk mengurangi bias JUDI) ---
    for (let i = 0; i < 30000; i++) {
        let text = `${getRandom(judolPrefix)} ${getRandom(judolGames)} ${getRandom(judolBait)}!`;
        if (Math.random() > 0.5) text = text.replace(/a/g, '@').replace(/i/g, '1');
        
        text = addTypo(text);
        text = unicodeSpoof(text);
        text = addHiddenSpace(text);
        dataset.push({ label: 'JUDI', text: randomCase(text) }); 
    }

    // --- 3. GENERATE HACK DATA (Target ~35000) ---
    for (let i = 0; i < 35000; i++) {
        const action = getRandom(hackActions);
        const target = getRandom(hackTargets);
        let text = `${action}${target}`;
        
        const rand = Math.random();
        if (rand < 0.2) text += '));';
        else if (rand < 0.4) text += ' ?>';
        else if (rand < 0.6) text += '</s' + 'cri' + 'pt>';
        else text += ';';
        
        text = addHiddenSpace(text);
        dataset.push({ label: 'HACK', text });
    }

    // --- 4. GENERATE AMBIGU DATA (Target ~10000) ---
    for (let i = 0; i < 10000; i++) {
        let text = `${getRandom(ambiguSubjects)} ${getRandom(ambiguContexts)}.`;
        dataset.push({ label: 'AMBIGU', text });
    }

    return dataset;
}
