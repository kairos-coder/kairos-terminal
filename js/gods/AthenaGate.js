// AthenaGate.js - Wisdom judgment

export const AthenaGate = {
    threshold: 65, // Minimum wisdom score to pass
    
    calculateScore(body) {
        let score = 0;
        if (/[A-Z]/.test(body)) score += 15;
        if (/[.!?]$/.test(body)) score += 15;
        if (body.split(/\s+/).length >= 20) score += 20;
        if (new Set(body.toLowerCase().split(/\s+/)).size > 8) score += 15;
        if (/(because|therefore|however|although)/i.test(body)) score += 15;
        if (/(like|as|seems|appears)/i.test(body)) score += 10;
        if (/(and|or|but|so|for)/i.test(body)) score += 10;
        return Math.min(100, score);
    },
    
    generateFeedback(body) {
        const feedback = [];
        if (!/[A-Z]/.test(body)) feedback.push("Begin with a capital letter.");
        if (!/[.!?]$/.test(body)) feedback.push("End with a period, question mark, or exclamation.");
        if (body.split(/\s+/).length < 20) feedback.push("At least 20 words. Show depth.");
        if (new Set(body.toLowerCase().split(/\s+/)).size <= 8) feedback.push("Use more varied vocabulary.");
        if (!/(because|therefore|however|although)/i.test(body)) feedback.push("Use connecting words (because, therefore, however).");
        if (!/(like|as|seems|appears)/i.test(body)) feedback.push("Paint a picture. Use imagery (like, as, seems).");
        return feedback.slice(0, 3);
    },
    
    judge(entry, isDream = false) {
        const score = this.calculateScore(entry.body);
        const threshold = isDream ? 50 : this.threshold;
        const passed = score >= threshold;
        
        return {
            passed,
            score,
            threshold,
            feedback: passed ? [] : this.generateFeedback(entry.body),
            entry
        };
    }
};
