import { PieceCategory } from '@activepieces/core-piece-types'
import { pieceTranslation } from './i18n'

export const pieceTranslationPaths = {
  extract: ({ piece }: ExtractParams): TranslatableString[] => {
    return pieceTranslation.pathsToTranslate(piece.categories).flatMap((pattern) => expand({ node: piece, segments: pattern.split('.'), prefix: [] }))
  },

  englishByPath: ({ piece }: ExtractParams): Record<string, string> => {
    return Object.fromEntries(pieceTranslationPaths.extract({ piece }).map(({ path, english }) => [path, english]))
  },
}

function expand({ node, segments, prefix }: ExpandParams): TranslatableString[] {
  const [segment, ...rest] = segments
  if (segment === undefined) {
    return typeof node === 'string' && node.length > 0 ? [{ path: joinPath(prefix), english: node }] : []
  }
  if (!isRecord(node)) {
    return []
  }
  const children = segment === '*' ? childrenOf(node) : [{ id: segment, child: node[segment] }]
  return children.flatMap(({ id, child }) => expand({ node: child, segments: rest, prefix: [...prefix, id] }))
}

function childrenOf(node: Record<string, unknown>): PathChild[] {
  if (!Array.isArray(node)) {
    return Object.entries(node).map(([id, child]) => ({ id, child }))
  }
  const identities = node.map((child: unknown) => elementIdentity(child))
  return node.map((child: unknown, index: number) => {
    const identity = identities[index]
    const unique = identity !== undefined && identities.indexOf(identity) === identities.lastIndexOf(identity)
    return { id: unique ? `[${identity}]` : `[${index}]`, child }
  })
}

function elementIdentity(child: unknown): string | undefined {
  if (!isRecord(child)) {
    return undefined
  }
  const field = IDENTITY_FIELDS.find((name) => child[name] !== undefined)
  if (field === undefined) {
    return undefined
  }
  const value = child[field]
  return `${field}=${typeof value === 'string' ? value : JSON.stringify(value)}`
}

function joinPath(segments: string[]): string {
  return segments.reduce((path, segment) => {
    if (path.length === 0) {
      return segment
    }
    return segment.startsWith('[') ? `${path}${segment}` : `${path}.${segment}`
  }, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const IDENTITY_FIELDS = ['value', 'key']

export type TranslatableString = {
  path: string
  english: string
}

type ExtractParams = {
  piece: { categories?: PieceCategory[] } & object
}

type ExpandParams = {
  node: unknown
  segments: string[]
  prefix: string[]
}

type PathChild = {
  id: string
  child: unknown
}
