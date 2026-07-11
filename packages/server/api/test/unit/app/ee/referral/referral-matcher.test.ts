import { PhraseCandidate, referralMatcher } from '../../../../../src/app/ee/referral/referral-matcher'

const CANONICAL = 'I grow potatoes in my room and I call it Ash'

function candidatesFrom(displayPhrases: string[]): PhraseCandidate[] {
    return displayPhrases.map((phrase, index) => ({
        id: `phrase-${index}`,
        normalizedPhrase: referralMatcher.normalize(phrase),
    }))
}

describe('referralMatcher.normalize', () => {
    it('lowercases, strips punctuation and collapses whitespace', () => {
        expect(referralMatcher.normalize('  I GROW,  Potatoes!!  ')).toBe('i grow potatoes')
    })

    it('strips diacritics so accented variants converge', () => {
        expect(referralMatcher.normalize('café')).toBe(referralMatcher.normalize('cafe'))
    })

    it('is stable across punctuation-only and casing-only differences', () => {
        expect(referralMatcher.normalize('Hello, World.')).toBe(referralMatcher.normalize('hello world'))
    })
})

describe('referralMatcher.hash', () => {
    it('is deterministic for equal normalized inputs', () => {
        const a = referralMatcher.hash(referralMatcher.normalize(CANONICAL))
        const b = referralMatcher.hash(referralMatcher.normalize(CANONICAL.toUpperCase()))
        expect(a).toBe(b)
    })
})

describe('referralMatcher.matchPhrase', () => {
    const candidates = candidatesFrom([CANONICAL])

    it('matches an exact copy-paste (distance 0, exact)', () => {
        const match = referralMatcher.matchPhrase({ text: CANONICAL, candidates })
        expect(match?.matchType).toBe('exact')
        expect(match?.distance).toBe(0)
    })

    it('matches casing + punctuation variants exactly after normalization', () => {
        const match = referralMatcher.matchPhrase({ text: 'i grow potatoes in my room, and i call it ash!!!', candidates })
        expect(match?.matchType).toBe('exact')
    })

    it('matches a single-letter typo within threshold', () => {
        const match = referralMatcher.matchPhrase({ text: 'I grow potatos in my room and I call it Ash', candidates })
        expect(match).not.toBeNull()
        expect(match?.matchType).toBe('fuzzy')
        expect(match?.distance).toBeLessThanOrEqual(2)
    })

    it('matches an adjacent-character transposition', () => {
        const match = referralMatcher.matchPhrase({ text: 'I grow potaotes in my room and I call it Ash', candidates })
        expect(match).not.toBeNull()
        expect(match?.matchType).toBe('fuzzy')
    })

    it('rejects a semantic paraphrase (too many edits)', () => {
        const match = referralMatcher.matchPhrase({ text: 'I keep a potato plant in my bedroom that I named Ash', candidates })
        expect(match).toBeNull()
    })

    it('rejects an unrelated message', () => {
        const match = referralMatcher.matchPhrase({ text: 'list my open deals from the CRM please', candidates })
        expect(match).toBeNull()
    })

    it('returns null for an empty candidate set', () => {
        expect(referralMatcher.matchPhrase({ text: CANONICAL, candidates: [] })).toBeNull()
    })

    it('rejects an ambiguous fuzzy match against two equally-close phrases', () => {
        const ambiguousCandidates = candidatesFrom([
            'the quick brown fox jumps over',
            'the quick brown box jumps over',
        ])
        const match = referralMatcher.matchPhrase({ text: 'the quick brown cox jumps over', candidates: ambiguousCandidates })
        expect(match).toBeNull()
    })
})

describe('referralMatcher.areSafelyDistinct', () => {
    it('is false for identical phrases', () => {
        const p = referralMatcher.normalize('sam said we eat good tonight for real')
        expect(referralMatcher.areSafelyDistinct(p, p)).toBe(false)
    })

    it('is false for near-duplicates within the summed match tolerance', () => {
        const a = referralMatcher.normalize('sam said we eat good tonight for real')
        const b = referralMatcher.normalize('sam said we eat good tonihgt for rael')
        expect(referralMatcher.areSafelyDistinct(a, b)).toBe(false)
    })

    it('is true for clearly different phrases', () => {
        const a = referralMatcher.normalize('sam said we eat good tonight for real')
        const b = referralMatcher.normalize('pov mia just rerouted your entire personality')
        expect(referralMatcher.areSafelyDistinct(a, b)).toBe(true)
    })
})

describe('referralMatcher.hasRhyme', () => {
    it.each([
        'Dean crowned a sardine queen of cuisine',
        'Ash taught a brash catfish to dance',
        'the bears declared the chairs theirs',
        'Pete eats treats on repeat',
    ])('accepts a line with a real rhyme pair: %s', (phrase) => {
        expect(referralMatcher.hasRhyme(referralMatcher.normalize(phrase))).toBe(true)
    })

    it.each([
        'Ash built a library inside a teacup',
        'Ash claims he invented the snooze button',
        'Sam swears the office fern runs the company',
    ])('rejects a line with no rhyme at all: %s', (phrase) => {
        expect(referralMatcher.hasRhyme(referralMatcher.normalize(phrase))).toBe(false)
    })

    it('does not count the same word repeated as a rhyme', () => {
        expect(referralMatcher.hasRhyme(referralMatcher.normalize('Ash told Ash about the moon'))).toBe(false)
    })

    it('skips the gate when there are fewer than two rhyme-sized words', () => {
        expect(referralMatcher.hasRhyme(referralMatcher.normalize('猫がお茶会を主催しています'))).toBe(true)
    })
})
