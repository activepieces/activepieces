import { cryptoUtils } from '@activepieces/server-utils'

const MIN_PHRASE_LENGTH = 12
const MAX_PHRASE_LENGTH = 160
const NON_ALPHANUMERIC_REGEX = /[^\p{L}\p{N}\s]/gu
const WHITESPACE_REGEX = /\s+/g
const DIACRITIC_REGEX = /\p{Diacritic}/gu

function normalize(text: string): string {
    return text
        .normalize('NFKD')
        .replace(DIACRITIC_REGEX, '')
        .toLowerCase()
        .replace(NON_ALPHANUMERIC_REGEX, ' ')
        .replace(WHITESPACE_REGEX, ' ')
        .trim()
}

function hash(normalized: string): string {
    return cryptoUtils.hashSHA256(normalized)
}

function thresholdFor(length: number): number {
    return Math.max(2, Math.floor(length * 0.12))
}

function isPhraseShaped(normalized: string): boolean {
    return normalized.length >= MIN_PHRASE_LENGTH && normalized.length <= MAX_PHRASE_LENGTH
}

// Optimal String Alignment distance (Levenshtein + adjacent transpositions), bounded by
// maxDistance with a per-row early exit. Returns the distance when <= maxDistance, else null.
function boundedEditDistance(a: string, b: string, maxDistance: number): number | null {
    if (a === b) {
        return 0
    }
    const lenA = a.length
    const lenB = b.length
    if (Math.abs(lenA - lenB) > maxDistance) {
        return null
    }
    if (lenA === 0) {
        return lenB <= maxDistance ? lenB : null
    }
    if (lenB === 0) {
        return lenA <= maxDistance ? lenA : null
    }

    let prevPrev = new Array<number>(lenB + 1).fill(0)
    let prev = new Array<number>(lenB + 1)
    let curr = new Array<number>(lenB + 1)
    for (let j = 0; j <= lenB; j++) {
        prev[j] = j
    }

    for (let i = 1; i <= lenA; i++) {
        curr[0] = i
        let rowMin = curr[0]
        for (let j = 1; j <= lenB; j++) {
            const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
            let value = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
            if (
                i > 1 && j > 1 &&
                a.charCodeAt(i - 1) === b.charCodeAt(j - 2) &&
                a.charCodeAt(i - 2) === b.charCodeAt(j - 1)
            ) {
                value = Math.min(value, prevPrev[j - 2] + 1)
            }
            curr[j] = value
            if (value < rowMin) {
                rowMin = value
            }
        }
        if (rowMin > maxDistance) {
            return null
        }
        const rotated = prevPrev
        prevPrev = prev
        prev = curr
        curr = rotated
    }

    const distance = prev[lenB]
    return distance <= maxDistance ? distance : null
}

function matchPhrase({ text, candidates }: { text: string, candidates: PhraseCandidate[] }): PhraseMatch | null {
    const normalized = normalize(text)
    if (normalized.length === 0 || candidates.length === 0) {
        return null
    }

    for (const candidate of candidates) {
        if (candidate.normalizedPhrase === normalized) {
            return { candidate, distance: 0, matchType: 'exact' }
        }
    }

    if (!isPhraseShaped(normalized)) {
        return null
    }

    const maxDistance = thresholdFor(normalized.length)
    let best: PhraseMatch | null = null
    let ambiguous = false
    for (const candidate of candidates) {
        const distance = boundedEditDistance(normalized, candidate.normalizedPhrase, maxDistance)
        if (distance === null) {
            continue
        }
        if (best === null || distance < best.distance) {
            best = { candidate, distance, matchType: 'fuzzy' }
            ambiguous = false
        }
        else if (distance === best.distance && candidate.id !== best.candidate.id) {
            ambiguous = true
        }
    }
    if (best === null || ambiguous) {
        return null
    }
    return best
}

// Two normalized phrases are "safely distinct" when their edit-distance exceeds the SUM of their
// match tolerances — i.e. their acceptance balls don't overlap, so no single input can ever fall
// within tolerance of both. Enforced at claim time so the matcher can never confuse two phrases.
function areSafelyDistinct(a: string, b: string): boolean {
    const maxGap = thresholdFor(a.length) + thresholdFor(b.length)
    return boundedEditDistance(a, b, maxGap) === null
}

const RHYME_MIN_WORD_LENGTH = 3
const RHYME_MIN_SHARED_SUFFIX = 2

function sharedSuffixLength({ a, b }: { a: string, b: string }): number {
    let length = 0
    while (length < a.length && length < b.length && a[a.length - 1 - length] === b[b.length - 1 - length]) {
        length++
    }
    return length
}

// Cheap floor for the "phrases must rhyme" rule: at least one pair of DISTINCT words must share an
// ending (>= 2 trailing chars, e.g. cat/hat, sardine/cuisine). It can't hear sound, so rhymes
// spelled differently (grey/sleigh) are false-rejected — acceptable, the model just re-mints.
// Phrases with fewer than two rhyme-sized words (e.g. spaceless scripts) skip the gate.
function hasRhyme(normalized: string): boolean {
    const words = [...new Set(normalized.split(' ').filter((word) => word.length >= RHYME_MIN_WORD_LENGTH))]
    if (words.length < 2) {
        return true
    }
    return words.some((a, index) => words.slice(index + 1).some((b) => sharedSuffixLength({ a, b }) >= RHYME_MIN_SHARED_SUFFIX))
}

export const referralMatcher = {
    normalize,
    hash,
    thresholdFor,
    isPhraseShaped,
    matchPhrase,
    areSafelyDistinct,
    hasRhyme,
}

export type PhraseCandidate = {
    id: string
    normalizedPhrase: string
}

export type PhraseMatch = {
    candidate: PhraseCandidate
    distance: number
    matchType: 'exact' | 'fuzzy'
}
