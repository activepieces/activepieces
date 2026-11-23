import { I18nForPiece, PieceMetadataModel, PieceMetadataModelSummary } from "./piece-metadata"
import { LocalesEnum } from "@activepieces/core-utils"
import { MAX_KEY_LENGTH_FOR_CORWDIN, PieceCategory } from "@activepieces/core-piece-types"
import path from 'path';
import fs from 'fs/promises';

export const pieceTranslation = {
  translatePiece: <T extends PieceMetadataModelSummary | PieceMetadataModel>({ piece, locale }: TranslatePieceParams<T>): T => {
    const translations = locale ? piece.i18n?.[locale] : undefined
    if (!translations) {
      return piece
    }
    return translateNode({ node: piece, tree: translationTreeFor(piece.categories), translations })
  },

  translatableTextByJsonPath: ({ piece }: TranslatableTextByJsonPathParams): Record<string, string> => {
    return Object.fromEntries(collectText({ node: piece, tree: translationTreeFor(piece.categories), jsonPath: '' }))
  },

  pathsToTranslate: (categories?: PieceCategory[]): string[] => {
    return isCorePiece(categories) ? [...pieceTranslation.pathsToValuesToTranslate, 'displayName'] : pieceTranslation.pathsToValuesToTranslate
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
    "actions.*.propertyGroups.*.label",
    "actions.*.propertyGroups.*.description",
    "triggers.*.displayName",
    "triggers.*.description",
    "triggers.*.props.*.displayName",
    "triggers.*.props.*.description",
    "triggers.*.props.*.options.options.*.label",
    "triggers.*.propertyGroups.*.label",
    "triggers.*.propertyGroups.*.description"
  ]
}

const translationTree = buildTree(pieceTranslation.pathsToTranslate())
const coreTranslationTree = buildTree(pieceTranslation.pathsToTranslate([PieceCategory.CORE]))

function buildTree(paths: string[]): TranslationTree {
  return paths.reduce<TranslationTree>((tree, path) => addPath({ tree, keys: path.split('.') }), {})
}

function isCorePiece(categories: PieceCategory[] | undefined): boolean {
  return categories?.includes(PieceCategory.CORE) ?? false
}

function translationTreeFor(categories: PieceCategory[] | undefined): TranslationTree {
  return isCorePiece(categories) ? coreTranslationTree : translationTree
}

function addPath({ tree, keys: [key, ...rest] }: AddPathParams): TranslationTree {
  return { ...tree, [key]: rest.length === 0 ? null : addPath({ tree: tree[key] ?? {}, keys: rest }) }
}

function translateNode<N>({ node, tree, translations }: TranslateNodeParams<N>): N {
  if (!isRecord(node)) {
    return node
  }
  const changes: Record<string, unknown> = {}
  let changed = false
  for (const [key, subtree] of Object.entries(tree)) {
    for (const childKey of key === '*' ? Object.keys(node) : [key]) {
      const child = node[childKey]
      const translated = subtree === null ? translateValue({ value: child, translations }) : translateNode({ node: child, tree: subtree, translations })
      if (translated !== child) {
        changes[childKey] = translated
        changed = true
      }
    }
  }
  return changed ? Object.assign(Array.isArray(node) ? [] : {}, node, changes) : node
}

function translateValue({ value, translations }: TranslateValueParams): unknown {
  if (typeof value !== 'string') {
    return value
  }
  return translations[value.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)] || value
}

function collectText({ node, tree, jsonPath }: CollectTextParams): TextAtJsonPath[] {
  if (!isRecord(node)) {
    return []
  }
  return Object.entries(tree).flatMap<TextAtJsonPath>(([key, subtree]) => {
    const children = key === '*' ? childrenWithSegments(node) : [{ segment: key, child: node[key] }]
    return children.flatMap<TextAtJsonPath>(({ segment, child }) => {
      const childPath = appendSegment({ jsonPath, segment })
      if (subtree === null) {
        return typeof child === 'string' && child.length > 0 ? [[childPath, child]] : []
      }
      return collectText({ node: child, tree: subtree, jsonPath: childPath })
    })
  })
}

function childrenWithSegments(node: Record<string, unknown>): ChildWithSegment[] {
  if (!Array.isArray(node)) {
    return Object.entries(node).map(([segment, child]) => ({ segment, child }))
  }
  const identities = node.map((child: unknown) => elementIdentity(child))
  return node.map((child: unknown, index: number) => {
    const identity = identities[index]
    const unique = identity !== undefined && identities.indexOf(identity) === identities.lastIndexOf(identity)
    return { segment: unique ? `[${identity}]` : `[${index}]`, child }
  })
}

function elementIdentity(child: unknown): string | undefined {
  if (!isRecord(child)) {
    return undefined
  }
  const field = ELEMENT_IDENTITY_FIELDS.find((name) => child[name] !== undefined)
  if (field === undefined) {
    return undefined
  }
  const value = child[field]
  return `${field}=${typeof value === 'string' ? value : JSON.stringify(value)}`
}

function appendSegment({ jsonPath, segment }: AppendSegmentParams): string {
  if (jsonPath.length === 0) {
    return segment
  }
  return segment.startsWith('[') ? `${jsonPath}${segment}` : `${jsonPath}.${segment}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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

const ELEMENT_IDENTITY_FIELDS = ['value', 'key']

type TranslatePieceParams<T extends PieceMetadataModelSummary | PieceMetadataModel> = {
  piece: T
  locale?: LocalesEnum
}

type TranslationTree = {
  [key: string]: TranslationTree | null
}

type AddPathParams = {
  tree: TranslationTree
  keys: string[]
}

type TranslateNodeParams<N> = {
  node: N
  tree: TranslationTree
  translations: Record<string, string>
}

type TranslateValueParams = {
  value: unknown
  translations: Record<string, string>
}

type TranslatableTextByJsonPathParams = {
  piece: { categories?: PieceCategory[] } & object
}

type TextAtJsonPath = [jsonPath: string, text: string]

type CollectTextParams = {
  node: unknown
  tree: TranslationTree
  jsonPath: string
}

type ChildWithSegment = {
  segment: string
  child: unknown
}

type AppendSegmentParams = {
  jsonPath: string
  segment: string
}
