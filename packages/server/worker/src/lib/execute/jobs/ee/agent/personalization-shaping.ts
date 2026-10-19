import { slugify } from '@activepieces/core-utils'
import { z } from 'zod'
import { CARDS_SCHEMA, MAX_DISPLAY_NAME_CHARS, MAX_USE_CASES, MIN_USE_CASES, PersonalizationUseCaseResult, PROFILE_SCHEMA, TITLE_HARD_MAX_CHARS } from './personalization-research-shared'

export function aOrAn(word: string): string {
    return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a'
}

export function cleanProfile({ raw }: { raw: z.infer<typeof PROFILE_SCHEMA> }): Record<string, unknown> {
    return {
        companyName: stripControlChars(raw.companyName).trim(),
        displayName: stripControlChars(raw.displayName).trim().slice(0, MAX_DISPLAY_NAME_CHARS),
        website: raw.website.trim(),
        description: raw.description.trim(),
        industry: raw.industry.trim(),
        ...(raw.userRole && raw.userRole.toLowerCase() !== 'unknown' ? { userRole: raw.userRole.trim() } : {}),
        ...(raw.roleConfidence ? { roleConfidence: raw.roleConfidence } : {}),
    }
}

export function cleanCards({ raw, limit = MAX_USE_CASES }: { raw: z.infer<typeof CARDS_SCHEMA>['useCases'], limit?: number }): PersonalizationUseCaseResult[] | null {
    const seenIds = new Set<string>()
    const seenTitles = new Set<string>()
    const artUses = new Map<string, number>()
    const useCases: PersonalizationUseCaseResult[] = []
    for (const candidate of raw) {
        const title = tidyTitle(candidate.title)
        const promptText = candidate.prompt.trim()
        const id = (candidate.id.trim() || slugify(title)).slice(0, 60)
        const titleKey = slugify(title)
        if (title.length === 0 || promptText.length === 0 || seenIds.has(id) || seenTitles.has(titleKey) || (artUses.get(candidate.imageId) ?? 0) >= MAX_USES_PER_ART) {
            continue
        }
        seenIds.add(id)
        seenTitles.add(titleKey)
        artUses.set(candidate.imageId, (artUses.get(candidate.imageId) ?? 0) + 1)
        useCases.push({
            id,
            title,
            prompt: promptText,
            imageId: candidate.imageId,
            ...(candidate.app ? { app: candidate.app.trim().toLowerCase() } : {}),
            kind: candidate.kind,
        })
        if (useCases.length >= limit) {
            break
        }
    }
    if (useCases.length < MIN_USE_CASES) {
        return null
    }
    return useCases
}

export function retargetProfileForUser({ companyProfile }: { companyProfile: Record<string, unknown> }): Record<string, unknown> {
    const { userRole: _userRole, roleConfidence: _roleConfidence, suggestedApps: _suggestedApps, ...companyFacts } = companyProfile
    return companyFacts
}

export function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : null
}

export function isMinorSpellingFix({ typed, suggested }: { typed: string, suggested: string }): boolean {
    const a = typed.trim().toLowerCase()
    const b = suggested.trim().toLowerCase()
    if (a === b) {
        return true
    }
    if (suggested.length === 0 || Math.abs(a.length - b.length) > 4) {
        return false
    }
    const threshold = Math.min(4, Math.max(2, Math.floor(a.length * 0.25)))
    return editDistance(a, b) <= threshold
}

const MAX_USES_PER_ART = 2

const DANGLING_TITLE_WORDS = new Set([
    'and', 'or', 'the', 'a', 'an', 'of', 'to', 'for', 'vs', 'with', 'my', 'our', 'in', 'on', 'at', 'from', 'into',
])

function tidyTitle(rawTitle: string): string {
    const trimmed = rawTitle.trim()
    if (trimmed.length <= TITLE_HARD_MAX_CHARS) {
        return trimmed
    }
    const cut = trimmed.slice(0, TITLE_HARD_MAX_CHARS + 1)
    const lastSpace = cut.lastIndexOf(' ')
    let result = lastSpace > 0 ? cut.slice(0, lastSpace) : trimmed.slice(0, TITLE_HARD_MAX_CHARS)
    for (;;) {
        const stripped = result.replace(/[,;:&-]+$/, '').trimEnd()
        const words = stripped.split(' ')
        const lastWord = words[words.length - 1]?.toLowerCase()
        if (words.length > 1 && lastWord !== undefined && DANGLING_TITLE_WORDS.has(lastWord)) {
            result = words.slice(0, -1).join(' ')
            continue
        }
        if (stripped !== result) {
            result = stripped
            continue
        }
        return result
    }
}

function editDistance(a: string, b: string): number {
    const previous = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        let diagonal = previous[0]
        previous[0] = i
        for (let j = 1; j <= b.length; j++) {
            const insertOrDelete = Math.min(previous[j], previous[j - 1]) + 1
            const substitute = diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
            diagonal = previous[j]
            previous[j] = Math.min(insertOrDelete, substitute)
        }
    }
    return previous[b.length]
}

function stripControlChars(value: string): string {
    // eslint-disable-next-line no-control-regex
    return value.replace(/[\u0000-\u001f\u007f]/g, '')
}
