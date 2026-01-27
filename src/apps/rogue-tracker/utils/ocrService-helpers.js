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
