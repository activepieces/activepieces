function classifyChange({ oldEnglish, newEnglish }: EnglishChange): ChangeClass {
    const oldWords = wordsOf(oldEnglish)
    const newWords = wordsOf(newEnglish)
    const sameWords = oldWords.length === newWords.length
        && oldWords.every((oldWord, index) => oldWord === newWords[index] || isCapitalisationOnly({ oldWord, newWord: newWords[index] }))
    if (!sameWords) {
        return 'reworded'
    }
    return oldEnglish.toLowerCase() === newEnglish.toLowerCase() ? 'case-only' : 'punct-whitespace-only'
}

function changedStrings({ oldEnglishByPath, newEnglishByPath }: ChangedStringsParams): ChangedString[] {
    const oldByPath = new Map(Object.entries(oldEnglishByPath))
    const edits = Object.entries(newEnglishByPath).flatMap(([path, newEnglish]) => {
        const oldEnglish = oldByPath.get(path)
        if (oldEnglish === undefined || toKey(oldEnglish) === toKey(newEnglish)) {
            return []
        }
        return [{ path, oldEnglish, newEnglish }]
    })
    const context: BlockerContext = {
        oldKeys: new Set(Object.values(oldEnglishByPath).map(toKey)),
        newKeys: new Set(Object.values(newEnglishByPath).map(toKey)),
        targetsByOldKey: distinctByKey({ pairs: edits.map(({ oldEnglish, newEnglish }) => [toKey(oldEnglish), toKey(newEnglish)]) }),
        sourcesByNewKey: distinctByKey({ pairs: edits.map(({ oldEnglish, newEnglish }) => [toKey(newEnglish), toKey(oldEnglish)]) }),
    }
    const pathsByEdit = edits.reduce((byEdit, { path, oldEnglish, newEnglish }) => {
        const id = `${toKey(oldEnglish)}\u0000${toKey(newEnglish)}`
        const known = byEdit.get(id)
        return byEdit.set(id, { oldEnglish, newEnglish, paths: [...(known?.paths ?? []), path] })
    }, new Map<string, Pick<ChangedString, 'oldEnglish' | 'newEnglish' | 'paths'>>())
    return [...pathsByEdit.values()].map(({ oldEnglish, newEnglish, paths }) => ({
        oldEnglish,
        newEnglish,
        paths,
        changeClass: classifyChange({ oldEnglish, newEnglish }),
        blocker: findBlocker({ oldKey: toKey(oldEnglish), newKey: toKey(newEnglish), context }),
    }))
}

function match({ changes, crowdinStrings }: MatchParams): MatchResult {
    const outcomes = changes.map((change) => matchOne({ change, crowdinStrings }))
    return {
        matched: outcomes.flatMap(({ matched }) => matched),
        skipped: outcomes.flatMap(({ skipped }) => skipped),
    }
}

function decide({ change, stringId, translationsByLanguage, approvalsByLanguage, autoApprovers }: DecideParams): RenameAction {
    const base = {
        stringId,
        oldText: change.oldEnglish,
        newText: change.newEnglish,
        identifier: identifierFor({ text: change.newEnglish }),
        changeClass: change.changeClass,
        paths: change.paths,
        autoApprovers,
    }
    const translatedLanguages = Object.keys(translationsByLanguage).filter((language) => translationsByLanguage[language].some((translation) => translation.stringId === stringId))
    if (TRIVIAL_CLASSES.includes(change.changeClass)) {
        return { ...base, updateOption: 'keep_translations_and_approvals', keptLanguages: translatedLanguages, clearedLanguages: [], reapproveOnUndo: [], needsReview: false }
    }
    const humanApprovedIds = (language: string): number[] => (approvalsByLanguage[language] ?? [])
        .filter((approval) => approval.stringId === stringId && !isAuto({ userName: approval.userName, autoApprovers }))
        .map(({ translationId }) => translationId)
    const keptLanguages = translatedLanguages.filter((language) => humanApprovedIds(language).length > 0)
    if (keptLanguages.length === 0) {
        return { ...base, updateOption: 'clear_translations_and_approvals', keptLanguages: [], clearedLanguages: [], reapproveOnUndo: [], needsReview: false }
    }
    return {
        ...base,
        updateOption: 'keep_translations',
        keptLanguages,
        clearedLanguages: translatedLanguages.filter((language) => !keptLanguages.includes(language)),
        reapproveOnUndo: keptLanguages.flatMap((language) => humanApprovedIds(language)),
        needsReview: true,
    }
}

function matchOne({ change, crowdinStrings }: { change: ChangedString, crowdinStrings: CrowdinString[] }): MatchResult {
    const reason = skipReason({ change, crowdinStrings })
    const holder = crowdinStrings.find(({ text }) => text === change.oldEnglish)
    if (reason !== null || holder === undefined) {
        return { matched: [], skipped: [{ change, reason: reason ?? 'not-in-crowdin' }] }
    }
    return { matched: [{ change, stringId: holder.id }], skipped: [] }
}

function machineTranslationIds({ translations, humanApprovedIds, autoApprovers }: MachineTranslationIdsParams): number[] {
    return translations
        .filter(({ id, userName }) => isAuto({ userName, autoApprovers }) && !humanApprovedIds.includes(id))
        .map(({ id }) => id)
}

function skipReason({ change, crowdinStrings }: { change: ChangedString, crowdinStrings: CrowdinString[] }): SkipReason | null {
    if (change.blocker !== null) {
        return change.blocker
    }
    if (change.oldEnglish.length > LONGEST_RENAMEABLE || change.newEnglish.length > LONGEST_RENAMEABLE) {
        return 'long-key'
    }
    const holders = crowdinStrings.filter(({ text }) => text === change.oldEnglish)
    if (holders.length === 0) {
        return 'not-in-crowdin'
    }
    if (holders.length > 1) {
        return 'ambiguous'
    }
    return crowdinStrings.some(({ text }) => text === change.newEnglish) ? 'new-already-in-crowdin' : null
}

function findBlocker({ oldKey, newKey, context }: { oldKey: string, newKey: string, context: BlockerContext }): RenameBlocker | null {
    if (context.newKeys.has(oldKey)) {
        return 'old-still-used'
    }
    if (context.oldKeys.has(newKey)) {
        return 'new-already-existed'
    }
    if ((context.targetsByOldKey.get(oldKey)?.size ?? 0) > 1) {
        return 'old-splits'
    }
    if ((context.sourcesByNewKey.get(newKey)?.size ?? 0) > 1) {
        return 'new-merges'
    }
    return null
}

function distinctByKey({ pairs }: { pairs: [string, string][] }): Map<string, Set<string>> {
    return pairs.reduce((byKey, [key, value]) => byKey.set(key, new Set([...(byKey.get(key) ?? []), value])), new Map<string, Set<string>>())
}

function identifierFor({ text }: { text: string }): string {
    return text.includes('.') ? `"${text}"` : text
}

function isAuto({ userName, autoApprovers }: { userName: string | null, autoApprovers: string[] }): boolean {
    return userName !== null && autoApprovers.includes(userName)
}

function wordsOf(text: string): string[] {
    return text.normalize('NFKC')
        .replace(DASH_VARIANT, '-')
        .replace(CURLY_SINGLE_QUOTE, '\'')
        .replace(CURLY_DOUBLE_QUOTE, '"')
        .split(WHITESPACE)
        .map((word) => word.replace(OPENING_PUNCTUATION, '').replace(CLOSING_PUNCTUATION, ''))
        .filter((word) => word.length > 0)
}

function isCapitalisationOnly({ oldWord, newWord }: { oldWord: string, newWord: string }): boolean {
    return PLAIN_WORD.test(oldWord) && PLAIN_WORD.test(newWord) && lowerFirstLetters(oldWord) === lowerFirstLetters(newWord)
}

function lowerFirstLetters(word: string): string {
    return word.replace(FIRST_LETTER, (letter) => letter.toLowerCase())
}

function toKey(english: string): string {
    return english.slice(0, MAX_KEY_LENGTH)
}

const MAX_KEY_LENGTH = 512
const LONGEST_RENAMEABLE = 510
const TRIVIAL_CLASSES: ChangeClass[] = ['case-only', 'punct-whitespace-only']
const DASH_VARIANT = /[\u2010-\u2015\u2212]/g
const CURLY_SINGLE_QUOTE = /[\u2018\u2019]/g
const CURLY_DOUBLE_QUOTE = /[\u201c\u201d]/g
const WHITESPACE = /\s+/
const OPENING_PUNCTUATION = /^['"(]+/
const CLOSING_PUNCTUATION = /[.,;:!?'")]+$/
const PLAIN_WORD = /^\p{L}+(?:['-]\p{L}+)*$/u
const FIRST_LETTER = /(?<=^|['-])\p{L}/gu

export const renamePlan = { classifyChange, changedStrings, match, decide, machineTranslationIds }

export type ChangeClass = 'case-only' | 'punct-whitespace-only' | 'reworded'

export type RenameBlocker = 'old-still-used' | 'new-already-existed' | 'old-splits' | 'new-merges'

export type SkipReason = RenameBlocker | 'long-key' | 'not-in-crowdin' | 'ambiguous' | 'new-already-in-crowdin'

export type UpdateOption = 'keep_translations_and_approvals' | 'keep_translations' | 'clear_translations_and_approvals'

export type ChangedString = {
    oldEnglish: string
    newEnglish: string
    paths: string[]
    changeClass: ChangeClass
    blocker: RenameBlocker | null
}

export type CrowdinString = {
    id: number
    text: string
    identifier: string
}

export type CrowdinTranslation = {
    translationId: number
    stringId: number
    userName: string | null
}

export type CrowdinApproval = {
    translationId: number
    stringId: number
    userName: string | null
}

export type MatchedChange = {
    change: ChangedString
    stringId: number
}

export type SkippedChange = {
    change: ChangedString
    reason: SkipReason
}

export type MatchResult = {
    matched: MatchedChange[]
    skipped: SkippedChange[]
}

export type RenameAction = {
    stringId: number
    oldText: string
    newText: string
    identifier: string
    changeClass: ChangeClass
    paths: string[]
    autoApprovers: string[]
    updateOption: UpdateOption
    keptLanguages: string[]
    clearedLanguages: string[]
    reapproveOnUndo: number[]
    needsReview: boolean
}

type EnglishChange = {
    oldEnglish: string
    newEnglish: string
}

type ChangedStringsParams = {
    oldEnglishByPath: Record<string, string>
    newEnglishByPath: Record<string, string>
}

type MatchParams = {
    changes: ChangedString[]
    crowdinStrings: CrowdinString[]
}

type DecideParams = MatchedChange & {
    translationsByLanguage: Record<string, CrowdinTranslation[]>
    approvalsByLanguage: Record<string, CrowdinApproval[]>
    autoApprovers: string[]
}

type MachineTranslationIdsParams = {
    translations: { id: number, userName: string | null }[]
    humanApprovedIds: number[]
    autoApprovers: string[]
}

type BlockerContext = {
    oldKeys: Set<string>
    newKeys: Set<string>
    targetsByOldKey: Map<string, Set<string>>
    sourcesByNewKey: Map<string, Set<string>>
}
