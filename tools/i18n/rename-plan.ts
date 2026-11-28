import { SourceStringsModel, StringTranslationsModel } from '@crowdin/crowdin-api-client'
import { MAX_KEY_LENGTH_FOR_CORWDIN } from '../../packages/core/piece-types/src/lib/piece'
import { TranslatableTextByJsonPath } from './translatable-text-by-json-path'

function classifyEdit({ oldEnglish, newEnglish }: EnglishTextPair): EditKind {
    const oldWords = wordsOf(oldEnglish)
    const newWords = wordsOf(newEnglish)
    const sameWords = oldWords.length === newWords.length
        && oldWords.every((oldWord, index) => oldWord === newWords[index] || isCapitalisationOnly({ oldWord, newWord: newWords[index] }))
    if (!sameWords) {
        return 'reworded'
    }
    return oldEnglish.toLowerCase() === newEnglish.toLowerCase() ? 'case-only' : 'punct-whitespace-only'
}

function englishEditsOf({ oldEnglishByJsonPath, newEnglishByJsonPath }: EnglishEditsOfParams): EnglishEdit[] {
    const oldEnglishOfJsonPath = new Map(Object.entries(oldEnglishByJsonPath))
    const editedJsonPaths = Object.entries(newEnglishByJsonPath).flatMap(([jsonPath, newEnglish]) => {
        const oldEnglish = oldEnglishOfJsonPath.get(jsonPath)
        if (oldEnglish === undefined || crowdinKeyOf(oldEnglish) === crowdinKeyOf(newEnglish)) {
            return []
        }
        return [{ jsonPath, oldEnglish, newEnglish }]
    })
    const crowdinKeyIndex: CrowdinKeyIndex = {
        oldKeys: new Set(Object.values(oldEnglishByJsonPath).map(crowdinKeyOf)),
        newKeys: new Set(Object.values(newEnglishByJsonPath).map(crowdinKeyOf)),
        newKeysByOldKey: distinctValuesByKey({ keyValuePairs: editedJsonPaths.map(({ oldEnglish, newEnglish }) => [crowdinKeyOf(oldEnglish), crowdinKeyOf(newEnglish)]) }),
        oldKeysByNewKey: distinctValuesByKey({ keyValuePairs: editedJsonPaths.map(({ oldEnglish, newEnglish }) => [crowdinKeyOf(newEnglish), crowdinKeyOf(oldEnglish)]) }),
    }
    const jsonPathsByEdit = editedJsonPaths.reduce((byEdit, { jsonPath, oldEnglish, newEnglish }) => {
        const editIdentity = `${crowdinKeyOf(oldEnglish)}\u0000${crowdinKeyOf(newEnglish)}`
        const editSoFar = byEdit.get(editIdentity)
        return byEdit.set(editIdentity, { oldEnglish, newEnglish, jsonPaths: [...(editSoFar?.jsonPaths ?? []), jsonPath] })
    }, new Map<string, Pick<EnglishEdit, 'oldEnglish' | 'newEnglish' | 'jsonPaths'>>())
    return [...jsonPathsByEdit.values()].map(({ oldEnglish, newEnglish, jsonPaths }) => ({
        oldEnglish,
        newEnglish,
        jsonPaths,
        editKind: classifyEdit({ oldEnglish, newEnglish }),
        blocker: renameBlockerOf({ oldKey: crowdinKeyOf(oldEnglish), newKey: crowdinKeyOf(newEnglish), crowdinKeyIndex }),
    }))
}

function matchCrowdinStrings({ edits, crowdinStrings }: MatchCrowdinStringsParams): CrowdinStringMatches {
    const matchesPerEdit = edits.map((edit) => matchEdit({ edit, crowdinStrings }))
    return {
        matched: matchesPerEdit.flatMap(({ matched }) => matched),
        skipped: matchesPerEdit.flatMap(({ skipped }) => skipped),
    }
}

function planRename({ edit, stringId, translationsByLanguage, approvalsByLanguage, languagesWaitingForReview }: PlanRenameParams): PlannedRename {
    const planForEveryEditKind = {
        stringId,
        oldEnglish: edit.oldEnglish,
        newEnglish: edit.newEnglish,
        newIdentifier: crowdinIdentifierOf({ english: edit.newEnglish }),
        editKind: edit.editKind,
        jsonPaths: edit.jsonPaths,
    }
    const translatedLanguages = Object.keys(translationsByLanguage).filter((language) => translationsByLanguage[language].some((translation) => translation.stringId === stringId))
    if (SAME_WORDS_EDIT_KINDS.includes(edit.editKind)) {
        return { ...planForEveryEditKind, updateOption: 'keep_translations_and_approvals', keptLanguages: translatedLanguages, clearedLanguages: [], translationIdsToReapproveOnUndo: [], humanApprovedLanguages: [], needsReview: false }
    }
    const humanApprovedTranslationIdsIn = (language: string): number[] => (approvalsByLanguage[language] ?? [])
        .filter((approval) => approval.stringId === stringId && !isPreTranslationAccount({ userName: approval.user?.username }))
        .map(({ translationId }) => translationId)
    const keptLanguages = translatedLanguages.filter((language) => humanApprovedTranslationIdsIn(language).length > 0 || languagesWaitingForReview.includes(language))
    if (keptLanguages.length === 0) {
        return { ...planForEveryEditKind, updateOption: 'clear_translations_and_approvals', keptLanguages: [], clearedLanguages: [], translationIdsToReapproveOnUndo: [], humanApprovedLanguages: [], needsReview: false }
    }
    return {
        ...planForEveryEditKind,
        updateOption: 'keep_translations',
        keptLanguages,
        clearedLanguages: translatedLanguages.filter((language) => !keptLanguages.includes(language)),
        translationIdsToReapproveOnUndo: keptLanguages.flatMap((language) => humanApprovedTranslationIdsIn(language)),
        humanApprovedLanguages: keptLanguages.filter((language) => humanApprovedTranslationIdsIn(language).length > 0),
        needsReview: true,
    }
}

function automaticTranslationIdsWithoutHumanApproval({ translations, humanApprovedTranslationIds }: AutomaticTranslationIdsParams): number[] {
    return translations
        .filter(({ id, user }) => isPreTranslationAccount({ userName: user?.username }) && !humanApprovedTranslationIds.includes(id))
        .map(({ id }) => id)
}

function matchEdit({ edit, crowdinStrings }: { edit: EnglishEdit, crowdinStrings: CrowdinSourceString[] }): CrowdinStringMatches {
    const skipReason = skipReasonOf({ edit, crowdinStrings })
    const stringWithOldEnglish = crowdinStrings.find(({ text }) => text === edit.oldEnglish)
    if (skipReason !== null || stringWithOldEnglish === undefined) {
        return { matched: [], skipped: [{ edit, reason: skipReason ?? 'not-in-crowdin' }] }
    }
    return { matched: [{ edit, stringId: stringWithOldEnglish.id }], skipped: [] }
}

function skipReasonOf({ edit, crowdinStrings }: { edit: EnglishEdit, crowdinStrings: CrowdinSourceString[] }): SkipReason | null {
    if (edit.blocker !== null) {
        return edit.blocker
    }
    if (edit.oldEnglish.length > LONGEST_RENAMEABLE_ENGLISH || edit.newEnglish.length > LONGEST_RENAMEABLE_ENGLISH) {
        return 'long-key'
    }
    const stringsWithOldEnglish = crowdinStrings.filter(({ text }) => text === edit.oldEnglish)
    if (stringsWithOldEnglish.length === 0) {
        return crowdinStrings.filter(({ text }) => text === edit.newEnglish).length === 1 ? 'only-new-in-crowdin' : 'not-in-crowdin'
    }
    if (stringsWithOldEnglish.length > 1) {
        return 'ambiguous'
    }
    return crowdinStrings.some(({ text }) => text === edit.newEnglish) ? 'new-already-in-crowdin' : null
}

function renameBlockerOf({ oldKey, newKey, crowdinKeyIndex }: { oldKey: string, newKey: string, crowdinKeyIndex: CrowdinKeyIndex }): RenameBlocker | null {
    if (crowdinKeyIndex.newKeys.has(oldKey)) {
        return 'old-still-used'
    }
    if (crowdinKeyIndex.oldKeys.has(newKey)) {
        return 'new-already-existed'
    }
    if ((crowdinKeyIndex.newKeysByOldKey.get(oldKey)?.size ?? 0) > 1) {
        return 'old-splits'
    }
    if ((crowdinKeyIndex.oldKeysByNewKey.get(newKey)?.size ?? 0) > 1) {
        return 'new-merges'
    }
    return null
}

function distinctValuesByKey({ keyValuePairs }: { keyValuePairs: [string, string][] }): Map<string, Set<string>> {
    return keyValuePairs.reduce((byKey, [key, value]) => byKey.set(key, new Set([...(byKey.get(key) ?? []), value])), new Map<string, Set<string>>())
}

function crowdinIdentifierOf({ english }: { english: string }): string {
    return english.includes('.') ? `${IDENTIFIER_QUOTE}${english}${IDENTIFIER_QUOTE}` : english
}

function isPreTranslationAccount({ userName }: { userName: string | undefined }): boolean {
    return userName !== undefined && PRE_TRANSLATION_ACCOUNTS.includes(userName)
}

function wordsOf(english: string): string[] {
    return english.normalize('NFKC')
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

function crowdinKeyOf(english: string): string {
    return english.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)
}

const IDENTIFIER_QUOTE = '"'
const LONGEST_RENAMEABLE_ENGLISH = MAX_KEY_LENGTH_FOR_CORWDIN - 2 * IDENTIFIER_QUOTE.length
const SAME_WORDS_EDIT_KINDS: EditKind[] = ['case-only', 'punct-whitespace-only']
const DASH_VARIANT = /[‐-―−]/g
const CURLY_SINGLE_QUOTE = /[‘’]/g
const CURLY_DOUBLE_QUOTE = /[“”]/g
const WHITESPACE = /\s+/
const OPENING_PUNCTUATION = /^['"(]+/
const CLOSING_PUNCTUATION = /[.,;:!?'")]+$/
const PLAIN_WORD = /^\p{L}+(?:['-]\p{L}+)*$/u
const FIRST_LETTER = /(?<=^|['-])\p{L}/gu

export const PRE_TRANSLATION_ACCOUNTS = ['abuaboud']

export const renamePlan = { classifyEdit, englishEditsOf, matchCrowdinStrings, planRename, automaticTranslationIdsWithoutHumanApproval }

export type EditKind = 'case-only' | 'punct-whitespace-only' | 'reworded'

export type RenameBlocker = 'old-still-used' | 'new-already-existed' | 'old-splits' | 'new-merges'

export type SkipReason = RenameBlocker | 'long-key' | 'not-in-crowdin' | 'only-new-in-crowdin' | 'ambiguous' | 'new-already-in-crowdin'

export type EnglishEdit = {
    oldEnglish: string
    newEnglish: string
    jsonPaths: string[]
    editKind: EditKind
    blocker: RenameBlocker | null
}

export type CrowdinSourceString = Pick<SourceStringsModel.String, 'id' | 'text'>

export type LanguageTranslation = Pick<StringTranslationsModel.PlainLanguageTranslation, 'stringId'>

export type TranslationApproval = Pick<StringTranslationsModel.Approval, 'translationId' | 'stringId'> & CrowdinUserOrNone

export type StringTranslationAuthor = Pick<StringTranslationsModel.StringTranslation, 'id'> & CrowdinUserOrNone

export type MatchedEdit = {
    edit: EnglishEdit
    stringId: number
}

export type SkippedEdit = {
    edit: EnglishEdit
    reason: SkipReason
}

export type CrowdinStringMatches = {
    matched: MatchedEdit[]
    skipped: SkippedEdit[]
}

export type PlannedRename = {
    stringId: number
    oldEnglish: string
    newEnglish: string
    newIdentifier: string
    editKind: EditKind
    jsonPaths: string[]
    updateOption: SourceStringsModel.UpdateOption
    keptLanguages: string[]
    clearedLanguages: string[]
    translationIdsToReapproveOnUndo: number[]
    humanApprovedLanguages: string[]
    needsReview: boolean
}

type CrowdinUserOrNone = {
    user: Pick<StringTranslationsModel.User, 'username'> | null
}

type EnglishTextPair = {
    oldEnglish: string
    newEnglish: string
}

type EnglishEditsOfParams = {
    oldEnglishByJsonPath: TranslatableTextByJsonPath
    newEnglishByJsonPath: TranslatableTextByJsonPath
}

type MatchCrowdinStringsParams = {
    edits: EnglishEdit[]
    crowdinStrings: CrowdinSourceString[]
}

type PlanRenameParams = MatchedEdit & {
    translationsByLanguage: Record<string, LanguageTranslation[]>
    approvalsByLanguage: Record<string, TranslationApproval[]>
    languagesWaitingForReview: string[]
}

type AutomaticTranslationIdsParams = {
    translations: StringTranslationAuthor[]
    humanApprovedTranslationIds: number[]
}

type CrowdinKeyIndex = {
    oldKeys: Set<string>
    newKeys: Set<string>
    newKeysByOldKey: Map<string, Set<string>>
    oldKeysByNewKey: Map<string, Set<string>>
}
