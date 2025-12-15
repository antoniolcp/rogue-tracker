import Tesseract from 'tesseract.js';

export const ocrService = {
    async processImage(imageFile, setProgress) {
        try {
            const result = await Tesseract.recognize(
                imageFile,
                'eng', // GTA uses English mostly, or 'por' if localized
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.floor(m.progress * 100));
                        }
                    }
                }
            );

            return this.parseRaceResults(result.data.text);
        } catch (error) {
            console.error("OCR Error:", error);
            throw error;
        }
    },

    parseRaceResults(text) {
        // This logic needs to be tuned based on the actual GTA screenshot format
        // Usually it is: Position - PlayerName - ... - Time - Points
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const results = [];

        // Heuristic parsing - looking for lines that start with a number (position)
        lines.forEach(line => {
            // Very basic regex to capture Position and perhaps Name
            // Example: "1. PlayerOne  15"
            // This will need refinement with real data
            console.log("OCR Line:", line);
            // Placeholder logic
        });

        return { rawText: text, lines };
    }
};
