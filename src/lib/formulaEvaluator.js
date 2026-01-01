import { Parser } from 'hot-formula-parser'

/**
 * Evaluate a score formula using Excel-like syntax
 * @param {string} formula - The formula string (e.g., "SCORE * 10")
 * @param {number} rawScore - The raw score value to substitute for SCORE
 * @returns {{ result: number, error: string | null }}
 */
export function evaluateScoreFormula(formula, rawScore) {
    // If no formula, return raw score unchanged
    if (!formula || !formula.trim()) {
        return { result: rawScore, error: null }
    }

    const parser = new Parser()

    // Register SCORE as a variable
    parser.setVariable('SCORE', rawScore)

    const { result, error } = parser.parse(formula)

    if (error) {
        console.error('[formulaEvaluator] Parse error:', error)
        return { result: rawScore, error: error }
    }

    // Ensure result is a number
    const numResult = Number(result)
    if (isNaN(numResult)) {
        return { result: rawScore, error: 'Result is not a number' }
    }

    return { result: Math.floor(numResult), error: null }
}

/**
 * Validate a formula syntax without a real score
 * @param {string} formula - The formula to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateFormula(formula) {
    if (!formula || !formula.trim()) {
        return { valid: true, error: null }
    }

    const parser = new Parser()
    parser.setVariable('SCORE', 1) // Dummy value for validation

    const { error } = parser.parse(formula)

    if (error) {
        return { valid: false, error: error }
    }

    return { valid: true, error: null }
}
