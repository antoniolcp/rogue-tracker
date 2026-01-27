
import Tesseract from 'tesseract.js';

/**
 * Process a scoreboard image and extract battle data.
 * @param {File} imageFile The image file to process.
 * @returns {Promise<Object>} The extracted battle data (map, teams, rounds, etc.)
 */
export const recognizeImage = async (imageFile, knownPlayers = []) => {
    try {
        console.log('🖼️ Starting OCR for:', imageFile.name);

        // Pre-process image for better contrast (Light Text on Dark BG -> Black Text on White BG)
        const processedImage = await preprocessImage(imageFile);

        // Use local traineddata from public folder
        const worker = await Tesseract.createWorker('eng', 1, {
            langPath: window.location.origin + '/',
            gzip: false
        });

        // Configure for better numbers/text recognition if needed
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-. '
        });

        const ret = await worker.recognize(processedImage);
        await worker.terminate();

        console.log('📝 Text extracted:', ret.data.text);

        return parseScoreboardText(ret.data.text, knownPlayers);
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Falha ao processar a imagem: ' + (error.message || error));
    }
};

/**
 * Pre-process image to optimize for OCR (Grayscale + Invert + High Contrast)
 * @param {File} imageFile 
 * @returns {Promise<string>} Data URL of processed image
 */
const preprocessImage = (imageFile) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                // Grayscale (Luminance)
                const avg = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);

                // Invert (assuming Light Text on Dark BG -> Black Text on White BG)
                // We just invert. We do NOT threshold aggressively.
                // 255 - avg gives us the inverted value.
                // To increase contrast slightly without destroying detail:
                // We can stretch the histogram or just simple contrast.

                let val = 255 - avg;

                // Simple contrast enhancement:
                // Push darks down, lights up slightly
                // if (val < 50) val = 0;
                // if (val > 200) val = 255;

                // Let's just do simple Invert for now, Tesseract handles grayscale fairly well.
                // If we want "Black Text on White", dark background (low val) becomes high val (white).
                // Light text (high val) becomes low val (black).

                data[i] = val;     // R
                data[i + 1] = val; // G
                data[i + 2] = val; // B
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
    });
};

/**
 * Parse raw text from Tesseract into structured battle data.
 * This is a "best effort" parser based on typical Rogue Company scoreboard layout.
 * @param {string} text Raw text from OCR
 * @param {Array<string>} knownPlayers List of known player names
 * @returns {Object} Structured data { map, team1, team2, team1Rounds, team2Rounds }
 */
const parseScoreboardText = (text, knownPlayers = []) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    // Default structure
    const result = {
        map: 'Unknown',
        team1: [],
        team2: [],
        team1Rounds: 0,
        team2Rounds: 0
    };

    // Heuristics variables
    let currentTeam = 1;
    let playerBuffer = [];

    // Keywords to identify sections
    const statsHeaders = ['ELIMS', 'DOWNS', 'ASSISTS', 'REVIVES', 'DAMAGE'];
    const mapNames = [
        'High Castle', 'Skyfell', 'Vice', 'Wanted', 'Windward',
        'Lockdown', 'Canals', 'Icarus', 'The Arena', 'Breach',
        'Favela', 'Factory', 'Glacier', 'Palace', 'Hollows', 'Meltdown'
    ];

    console.log('--- START PARSE LINES ---');
    for (const line of lines) {
        let cleanLine = line.trim();

        // 1. Detect Map
        const foundMap = mapNames.find(m => cleanLine.toLowerCase().includes(m.toLowerCase()));
        if (foundMap && result.map === 'Unknown') {
            result.map = foundMap;
            console.log(`🗺️ Found Map: ${foundMap}`);
        }

        // 2. Detect Team Switch
        // Logic: specific divider lines or just filling up the first team.
        if (playerBuffer.length === 4) {
            // If we found 4 players, force switch to team 1
            if (currentTeam === 1) {
                result.team1 = [...playerBuffer];
                playerBuffer = [];
                currentTeam = 2;
                console.log('🔄 Switching to Team 2 automatically (4 players found for Team 1)');
            }
        }

        // 3. Detect Player Stats Row
        // Regex to find a sequence of numbers at the end of the line
        // We allow some common OCR letter-for-number swaps in the regex, then fix them later.
        // Look for at least 4 "number-like" blobs at the end.
        // e.g. "Name 25 16 12 1 2895 3"
        // Regex: (Name) (space) (num) (space) (num)...

        // Relaxed pattern: Name followed by 5+ groups of digits/letters
        // Added 'a' (4), 'e' (3), 'g' (6/9), 'q' (9), 't' (7) to allowed chars
        // CHANGED: Allow 1-6 digits for ALL fields (previously damage required 3-6)
        const statsPattern = /(.+?)\s+([0-9lioOszSBageqt]{1,5})\s+([0-9lioOszSBageqt]{1,5})\s+([0-9lioOszSBageqt]{1,5})\s+([0-9lioOszSBageqt]{1,5})\s+([0-9lioOszSBageqt]{1,6})\s+([0-9lioOszSBageqt]{0,5})/;
        const match = cleanLine.match(statsPattern);

        if (match) {
            // Aggressive name cleaning: remove all non-word chars from the START, and common prefixes like "ul - " or "Bl "
            let namePart = match[1].replace(/^[|\[\]\-_=+>!@#$%^&*()\\/]+/, '').trim();
            namePart = namePart.replace(/^(ul|Bl|al|cl|dl)\s+[-]?\s*/i, ''); // Common OCR artifacts before names

            const isHeader = statsHeaders.some(h => namePart.toUpperCase().includes(h));

            // Check if it looks like a valid player line
            if (!isHeader && namePart.length > 2 && namePart.length < 30) {

                let extractedName = fixCommonOCRNameErrors(namePart);

                // FUZZY MATCHING: Try to find a real player name
                if (knownPlayers && knownPlayers.length > 0) {
                    const closest = findClosestMatch(extractedName, knownPlayers);
                    if (closest) {
                        console.log(`🪄 Auto-corrected "${extractedName}" to "${closest}"`);
                        extractedName = closest;
                    }
                }

                const parseStat = (val) => {
                    if (!val) return 0;
                    // Fix common OCR swaps
                    const fixed = val.toLowerCase()
                        .replace(/l/g, '1')
                        .replace(/i/g, '1')
                        .replace(/o/g, '0')
                        .replace(/s/g, '5')
                        .replace(/z/g, '2')
                        .replace(/b/g, '8')
                        .replace(/a/g, '4')
                        .replace(/e/g, '3')
                        .replace(/t/g, '7')
                        .replace(/g/g, '6') // or 9, ambiguous. Default to 6.
                        .replace(/q/g, '9');
                    return parseInt(fixed.replace(/\D/g, '')) || 0;
                };

                // Special case for 'ss' -> 55 is typically wrong if it should be 2 digits.
                // But we can't contextually fix 'ss' -> 35 easily. We accept 55.

                const player = {
                    id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name: extractedName,
                    operator: 'Unknown',
                    elims: parseStat(match[2]),
                    downs: parseStat(match[3]),
                    assists: parseStat(match[4]),
                    revives: parseStat(match[5]),
                    damage: parseStat(match[6]),
                    captures: parseStat(match[7])
                };

                console.log(`✅ Parsed Player: ${player.name} [E:${player.elims} D:${player.downs} A:${player.assists} R:${player.revives} Dmg:${player.damage}]`);

                if (result.team1.length + result.team2.length + playerBuffer.length < 8) {
                    playerBuffer.push(player);
                } else {
                    console.warn('⚠️ Found player but rosters are full, ignoring:', player.name);
                }
            } else {
                console.log(`⚠️ Ignored potential line (Header/Name invalid): "${cleanLine}" | NamePart: "${namePart}"`);
            }
        } else {
            // Optional: Log lines that didn't match regex to help debugging
            console.log(`❌ Regex mismatch: "${cleanLine}"`);
        }

        // 4. Detect Score (Rounds)
        // Look for patterns like "3 - 0", "VICTORY 3", "DEFEAT 2"
        // This is very unreliable in OCR. We might default to 0-0 or ask user.
        if (cleanLine.includes('VICTORY') || cleanLine.includes('DEFEAT')) {
            // Try to find a single digit nearby
            const scoreMatch = cleanLine.match(/[0-3]/);
            if (scoreMatch) {
                // const score = parseInt(scoreMatch[0]);
                // Assign to current winning/losing context if possible, 
                // but lacking context, we might just store it to suggest later.
                // For now, let's leave 0-0.
            }
        }
    }

    // Flush remaining buffer
    if (playerBuffer.length > 0) {
        if (currentTeam === 1) {
            result.team1 = playerBuffer;
        } else {
            result.team2 = playerBuffer;
        }
    }

    // Fill empty spots if OCR missed lines
    while (result.team1.length < 4) result.team1.push(createEmptyPlayer());
    while (result.team2.length < 4) result.team2.push(createEmptyPlayer());

    return result;
};

const createEmptyPlayer = () => ({
    id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: 'Unknown',
    operator: 'Unknown',
    elims: 0, downs: 0, assists: 0, revives: 0, damage: 0, captures: 0
});

const fixCommonOCRNameErrors = (name) => {
    // Common fixes for specific players if needed
    return name.replace(/[^\w\s._-]/g, '').trim();
};
// Append these functions to the end of src/apps/rogue-tracker/utils/ocrService.js

/**
 * Find the closest string in a list of possibilities using Levenshtein distance.
 * @param {string} target The scanned text
 * @param {Array<string>} possibilities List of known names
 * @returns {string|null} The best match or null if no good match found
 */
const findClosestMatch = (target, possibilities) => {
    if (!target || target.length < 3) return null;

    let bestMatch = null;
    let minDistance = Infinity;

    // Threshold: Max errors allowed (e.g. 30% of length)
    // For short names (4 chars), allow 1 error. Long (10), allow 3.
    const maxErrors = Math.floor(target.length * 0.4) + 1;

    for (const candidate of possibilities) {
        const dist = levenshteinDistance(target.toLowerCase(), candidate.toLowerCase());

        if (dist < minDistance && dist <= maxErrors) {
            minDistance = dist;
            bestMatch = candidate;
        }
    }

    return bestMatch;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (a, b) => {
    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};
