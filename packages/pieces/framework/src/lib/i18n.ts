import path from 'path'
import fs from 'fs/promises'
import { isObject, LocalesEnum } from '@activepieces/core-utils'
import { MAX_KEY_LENGTH_FOR_CORWDIN } from '@activepieces/core-piece-types'
import { I18nForPiece } from './piece-metadata'

function translatePiece<T extends Record<string, unknown>>({ piece, translations }: TranslatePieceParams<T>): T {
  if (!translations) {
    return piece
  }
  return PATH_SEGMENTS.reduce(
    (translatedPiece, segments) => translateRecord({ record: translatedPiece, segments, translations }),
    piece,
  )
}

async function initializeI18n(pieceOutputPath: string): Promise<I18nForPiece | undefined> {
  try {
    const i18n: I18nForPiece = {}
    for (const locale of Object.values(LocalesEnum)) {
      const translations = await readLocaleFile({ locale, pieceOutputPath })
      if (translations) {
        i18n[locale] = translations
      }
    }
    return Object.keys(i18n).length > 0 ? i18n : undefined
  }
  catch (err) {
    console.log(`Error initializing i18n for ${pieceOutputPath}:`, err)
    return undefined
  }
}

function translateRecord<R extends Record<string, unknown>>({ record, segments, translations }: TranslateRecordParams<R>): R {
  const [property, ...rest] = segments
  const child = record[property]
  const translatedChild = rest.length === 0
    ? translateLeaf({ leaf: child, translations })
    : translateValue({ value: child, segments: rest, translations })
  return translatedChild === child ? record : { ...record, [property]: translatedChild }
}

function translateValue({ value, segments, translations }: TranslateValueParams): unknown {
  if (segments[0] !== '*') {
    return isObject(value) ? translateRecord({ record: value, segments, translations }) : value
  }
  const rest = segments.slice(1)
  return translateChildren({
    container: value,
    translateChild: (child) => translateValue({ value: child, segments: rest, translations }),
  })
}

function translateChildren({ container, translateChild }: TranslateChildrenParams): unknown {
  if (Array.isArray(container)) {
    const items: unknown[] = container
    const translatedItems = items.map((item) => translateChild(item))
    return translatedItems.some((item, index) => item !== items[index]) ? translatedItems : container
  }
  if (!isObject(container)) {
    return container
  }
  const translatedEntries = Object.entries(container).map(([property, child]): [string, unknown] => [property, translateChild(child)])
  const changed = translatedEntries.some(([property, child]) => child !== container[property])
  return changed ? Object.fromEntries(translatedEntries) : container
}

function translateLeaf({ leaf, translations }: TranslateLeafParams): unknown {
  if (typeof leaf !== 'string' || leaf.length === 0) {
    return leaf
  }
  const translationKey = leaf.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)
  const translation = Object.hasOwn(translations, translationKey) ? translations[translationKey] : undefined
  return translation || leaf
}

async function readLocaleFile({ locale, pieceOutputPath }: ReadLocaleFileParams) {
  const filePath = path.join(pieceOutputPath, 'src', 'i18n', `${locale}.json`)
  if (!(await fileExists(filePath))) {
    return null
  }
  try {
    const fileContent = await fs.readFile(filePath, 'utf8')
    const translations = JSON.parse(fileContent)
    if (typeof translations === 'object' && translations !== null) {
      return translations
    }
    throw new Error(`Invalid i18n file format for ${locale} in piece ${pieceOutputPath}`)
  }
  catch (error) {
    console.error(`Error reading i18n file for ${locale} in piece ${pieceOutputPath}:`, error)
    return null
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  }
  catch {
    return false
  }
}

const PATHS_TO_VALUES_TO_TRANSLATE = [
  'description',
  'auth.username.displayName',
  'auth.username.description',
  'auth.password.displayName',
  'auth.password.description',
  'auth.props.*.displayName',
  'auth.props.*.description',
  'auth.props.*.options.options.*.label',
  'auth.description',
  'actions.*.displayName',
  'actions.*.description',
  'actions.*.props.*.displayName',
  'actions.*.props.*.description',
  'actions.*.props.*.options.options.*.label',
  'triggers.*.displayName',
  'triggers.*.description',
  'triggers.*.props.*.displayName',
  'triggers.*.props.*.description',
  'triggers.*.props.*.options.options.*.label',
]

const PATH_SEGMENTS = PATHS_TO_VALUES_TO_TRANSLATE.map((pathToValue) => pathToValue.split('.'))

export const pieceTranslation = {
  translatePiece,
  initializeI18n,
  pathsToValuesToTranslate: PATHS_TO_VALUES_TO_TRANSLATE,
}

type TranslatePieceParams<T> = {
  piece: T
  translations: Translations | undefined
}

type TranslateRecordParams<R> = {
  record: R
  segments: string[]
  translations: Translations
}

type TranslateValueParams = {
  value: unknown
  segments: string[]
  translations: Translations
}

type TranslateChildrenParams = {
  container: unknown
  translateChild: (child: unknown) => unknown
}

type TranslateLeafParams = {
  leaf: unknown
  translations: Translations
}

type ReadLocaleFileParams = {
  locale: LocalesEnum
  pieceOutputPath: string
}

type Translations = Record<string, string>
