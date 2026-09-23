import { I18nForPiece } from "./piece-metadata"
import { isObject, LocalesEnum } from "@activepieces/core-utils"
import { MAX_KEY_LENGTH_FOR_CORWDIN } from "@activepieces/core-piece-types"
import path from 'path';
import fs from 'fs/promises';

export const pieceTranslation = {
  translatePiece: <T>({ piece, translations }: TranslatePieceParams<T>): T => {
    if (!translations) {
      return piece
    }
    const translated = pieceTranslation.pathsToValuesToTranslate.reduce<unknown>(
      (node, key) => translateAtPath({ node, keys: key.split('.'), translations }),
      piece,
    )
    return translated as T
  },

  /**Gets the piece metadata regardles of piece location (node_modules or dist), wasn't included inside piece.metadata() for backwards compatibility issues (if an old ap version installs a new piece it would fail)*/
  initializeI18n: async (pieceOutputPath: string): Promise<I18nForPiece | undefined> => {
    try {
      const locales = Object.values(LocalesEnum);
      const i18n: I18nForPiece = {};
      
      for (const locale of locales) {
        const translations = await readLocaleFile(locale, pieceOutputPath);
        if (translations) {
          i18n[locale] = translations;
        }
      }
      
      return Object.keys(i18n).length > 0 ? i18n : undefined;
    }
    catch (err) {
      console.log(`Error initializing i18n for ${pieceOutputPath}:`, err)
      return undefined
    }
  },

  pathsToValuesToTranslate: [
    "description",
    "auth.username.displayName",
    "auth.username.description",
    "auth.password.displayName",
    "auth.password.description",
    "auth.props.*.displayName",
    "auth.props.*.description",
    "auth.props.*.options.options.*.label",
    "auth.description",
    "actions.*.displayName",
    "actions.*.description",
    "actions.*.props.*.displayName",
    "actions.*.props.*.description",
    "actions.*.props.*.options.options.*.label",
    "triggers.*.displayName",
    "triggers.*.description",
    "triggers.*.props.*.displayName",
    "triggers.*.props.*.description",
    "triggers.*.props.*.options.options.*.label"
  ]
}

function translateAtPath({ node, keys, translations }: TranslateAtPathParams): unknown {
  const [head, ...rest] = keys
  if (head === '*') {
    return mapChildren({ node, map: (child) => translateAtPath({ node: child, keys: rest, translations }) })
  }
  if (!isObject(node)) {
    return node
  }
  const child = node[head]
  const translatedChild = rest.length > 0
    ? translateAtPath({ node: child, keys: rest, translations })
    : translateValue({ value: child, translations })
  return translatedChild === child ? node : { ...node, [head]: translatedChild }
}

function translateValue({ value, translations }: TranslateValueParams): unknown {
  if (typeof value !== 'string' || value.length === 0) {
    return value
  }
  const key = value.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)
  const translated = Object.hasOwn(translations, key) ? translations[key] : undefined
  return translated || value
}

function mapChildren({ node, map }: MapChildrenParams): unknown {
  if (Array.isArray(node)) {
    const mapped = node.map((child: unknown) => map(child))
    return mapped.some((child, index) => child !== node[index]) ? mapped : node
  }
  if (!isObject(node)) {
    return node
  }
  const mappedEntries = Object.entries(node).map(([key, child]): [string, unknown] => [key, map(child)])
  const changed = mappedEntries.some(([key, child]) => child !== node[key])
  return changed ? Object.fromEntries(mappedEntries) : node
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const readLocaleFile = async (locale: LocalesEnum, pieceOutputPath: string) => {
  const filePath = path.join(pieceOutputPath, 'src', 'i18n', `${locale}.json`);
  if (!(await fileExists(filePath))) {
    return null;
  }

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const translations = JSON.parse(fileContent);
    if (typeof translations === 'object' && translations !== null) {
      return translations;
    }
    throw new Error(`Invalid i18n file format for ${locale} in piece ${pieceOutputPath}`);
  } catch (error) {
    console.error(`Error reading i18n file for ${locale} in piece ${pieceOutputPath}:`, error);
    return null;
  }
}

type TranslatePieceParams<T> = {
  piece: T
  translations: Translations | undefined
}

type TranslateAtPathParams = {
  node: unknown
  keys: string[]
  translations: Translations
}

type TranslateValueParams = {
  value: unknown
  translations: Translations
}

type MapChildrenParams = {
  node: unknown
  map: (child: unknown) => unknown
}

type Translations = Record<string, string>
