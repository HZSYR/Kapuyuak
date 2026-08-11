import bayes from 'bayes';
import { generateMegaDataset } from './kpk4444-lib/kapuyuak-dataset.js';

async function test() {
    const data = generateMegaDataset();
    const classifier = bayes();

    for (const item of data) {
        try {
            await classifier.learn(item.text, item.label);
        } catch (e) {}
    }

    const payload = JSON.stringify({
        title: "jurnal penelitian",
        checklist: ["1", "1", "1", "1", "1", "1"],
        privacyConsent: "1"
    });

    const result = await classifier.categorize(payload);
    console.log("Result:", result);

    const tokens = classifier.tokenizer(payload);
    
    // Check internal probabilities
    for (const cat of Object.keys(classifier.categories)) {
        console.log(`\nCategory: ${cat}`);
        const freqCount = classifier.wordFrequencyCount[cat] || {};
        for (const token of tokens) {
            const count = freqCount[token] || 0;
            if (count > 0) {
                console.log(`  Token '${token}': count=${count}`);
            }
        }
    }
}
test();
