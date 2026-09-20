import fs from 'fs'
import path from 'path'
import { LocalesEnum } from '@activepieces/core-utils'
import { MAX_KEY_LENGTH_FOR_CORWDIN } from '@activepieces/core-piece-types'
import { pieceTranslation } from '../src/lib/i18n'

const DE = LocalesEnum.GERMAN

function legacyTranslateProperty(obj: Record<string, unknown>, p: string, i18n: Record<string, string>): void {
  const parsedKeys = p.split('.')
  if (parsedKeys[0] === '*') {
    Object.values(obj).forEach(item => legacyTranslateProperty(item as Record<string, unknown>, parsedKeys.slice(1).join('.'), i18n))
    return
  }
  const nextObject = obj[parsedKeys[0]] as Record<string, unknown>
  if (!nextObject) return
  if (parsedKeys.length > 1) {
    legacyTranslateProperty(nextObject, parsedKeys.slice(1).join('.'), i18n)
    return
  }
  const propertyValue = obj[parsedKeys[0]] as string
  const valueInI18n = i18n[propertyValue.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)]
  if (valueInI18n) obj[parsedKeys[0]] = valueInI18n
}

function legacyTranslatePiece(piece: Record<string, unknown>, locale: LocalesEnum): Record<string, unknown> {
  const i18n = piece.i18n as Record<string, Record<string, string>> | undefined
  const target = i18n?.[locale]
  if (!target) return piece
  const translatedPiece = JSON.parse(JSON.stringify(piece))
  pieceTranslation.pathsToValuesToTranslate.forEach(key => legacyTranslateProperty(translatedPiece, key, target))
  return translatedPiece
}

const longKey = 'x'.repeat(MAX_KEY_LENGTH_FOR_CORWDIN + 40)

const prop = (displayName: string, description: string, labels: string[] = []) => ({
  displayName,
  description,
  required: false,
  type: 'SHORT_TEXT',
  ...(labels.length > 0 ? { options: { options: labels.map((label, i) => ({ label, value: `v${i}` })) } } : {}),
})

const fixtures: Record<string, unknown>[] = [
  {
    name: 'plain', displayName: 'Plain', description: 'Send a message',
    auth: undefined, actions: {}, triggers: {},
    i18n: { [DE]: { 'Send a message': 'Eine Nachricht senden' } },
  },
  {
    name: 'no-matching-locale', displayName: 'None', description: 'Send a message',
    actions: {}, triggers: {}, i18n: { fr: { 'Send a message': 'Envoyer' } },
  },
  {
    name: 'no-i18n-at-all', displayName: 'Bare', description: 'Send a message',
    actions: {}, triggers: {},
  },
  {
    name: 'options-arrays', displayName: 'Options', description: 'Pick one',
    auth: { description: 'Auth here', props: { token: prop('Token', 'The token', ['Alpha', 'Beta']) } },
    actions: {
      act: {
        name: 'act', displayName: 'Act now', description: 'Does a thing', requireAuth: true,
        props: { field: prop('Field', 'A field', ['Alpha', 'Beta', 'Untranslated']) },
      },
    },
    triggers: {
      trig: {
        name: 'trig', displayName: 'On thing', description: 'When a thing', requireAuth: true,
        props: { other: prop('Other', 'Another field', ['Beta']) },
      },
    },
    i18n: {
      [DE]: {
        'Pick one': 'Eins auswählen', 'Auth here': 'Hier anmelden',
        'Token': 'Zeichen', 'The token': 'Das Zeichen',
        'Act now': 'Jetzt handeln', 'Does a thing': 'Macht etwas',
        'Field': 'Feld', 'A field': 'Ein Feld',
        'On thing': 'Bei Sache', 'When a thing': 'Wenn eine Sache',
        'Other': 'Andere', 'Another field': 'Ein anderes Feld',
        'Alpha': 'Alfa', 'Beta': 'Beta-DE',
      },
    },
  },
  {
    name: 'username-password-auth', displayName: 'Basic', description: 'Basic auth piece',
    auth: {
      username: prop('User name', 'Your user name'),
      password: prop('Password', 'Your password'),
    },
    actions: {}, triggers: {},
    i18n: { [DE]: { 'Basic auth piece': 'Basis', 'User name': 'Benutzername', 'Your user name': 'Dein Benutzername', 'Password': 'Kennwort', 'Your password': 'Dein Kennwort' } },
  },
  {
    name: 'missing-and-odd-leaves', displayName: 'Odd', description: longKey,
    auth: null,
    actions: {
      a1: { name: 'a1', displayName: 'Keep', description: '', requireAuth: false, props: {} },
      a2: { name: 'a2', displayName: 'Also keep', requireAuth: false, props: { p: { displayName: 'P', required: false, type: 'NUMBER' } } },
    },
    triggers: {},
    i18n: { [DE]: { [longKey.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)]: 'Gekürzt', 'Keep': 'Behalten', 'P': 'Pe' } },
  },
]

describe('translatePiece copy-on-write', () => {
  it('matches the JSON-clone implementation on every fixture and locale', () => {
    for (const fixture of fixtures) {
      for (const locale of [DE, LocalesEnum.FRENCH, LocalesEnum.CHINESE_TRADITIONAL]) {
        const raw = JSON.stringify(fixture)
        const legacy = legacyTranslatePiece(JSON.parse(raw), locale)
        const actual = pieceTranslation.translatePiece({ piece: JSON.parse(raw), locale } as never)
        expect(JSON.stringify(actual)).toEqual(JSON.stringify(legacy))
      }
    }
  })

  it('leaves the input untouched when mutate is false', () => {
    for (const fixture of fixtures) {
      const raw = JSON.stringify(fixture)
      const input = JSON.parse(raw)
      pieceTranslation.translatePiece({ piece: input, locale: DE } as never)
      expect(JSON.stringify(input)).toEqual(raw)
    }
  })

  it('keeps option arrays as arrays', () => {
    const piece = fixtures.find(f => f.name === 'options-arrays')!
    const translated = pieceTranslation.translatePiece({ piece: JSON.parse(JSON.stringify(piece)), locale: DE } as never) as never as Record<string, never>
    const options = translated.actions.act.props.field.options.options
    expect(Array.isArray(options)).toBe(true)
    expect(options.map((o: { label: string }) => o.label)).toEqual(['Alfa', 'Beta-DE', 'Untranslated'])
  })

  it('shares untouched subtrees with the source instead of copying them', () => {
    const piece = JSON.parse(JSON.stringify(fixtures.find(f => f.name === 'options-arrays')))
    const summary = pieceTranslation.translatePiece({ piece, locale: DE, paths: pieceTranslation.pathsForSummary } as never) as never as Record<string, never>
    expect(summary.actions.act.props).toBe(piece.actions.act.props)
    expect(summary.actions.act.displayName).toEqual('Jetzt handeln')
  })

  it('translates the summary paths identically to the full path set', () => {
    const piece = fixtures.find(f => f.name === 'options-arrays')!
    const raw = JSON.stringify(piece)
    const full = pieceTranslation.translatePiece({ piece: JSON.parse(raw), locale: DE } as never) as never as Record<string, never>
    const summary = pieceTranslation.translatePiece({ piece: JSON.parse(raw), locale: DE, paths: pieceTranslation.pathsForSummary } as never) as never as Record<string, never>
    expect(summary.description).toEqual(full.description)
    expect(summary.actions.act.displayName).toEqual(full.actions.act.displayName)
    expect(summary.actions.act.description).toEqual(full.actions.act.description)
    expect(summary.triggers.trig.displayName).toEqual(full.triggers.trig.displayName)
    expect(JSON.stringify(summary.auth)).toEqual(JSON.stringify(full.auth))
  })
})

const corpus = process.env.PIECE_CORPUS_DIR
describe.skipIf(!corpus)('translatePiece copy-on-write against a real catalogue', () => {
  it('matches the JSON-clone implementation for every piece and locale', () => {
    const files = fs.readdirSync(corpus!)
    const mismatches: string[] = []
    let compared = 0
    for (const file of files) {
      const raw = fs.readFileSync(path.join(corpus!, file), 'utf8')
      const locales = Object.keys(JSON.parse(raw).i18n ?? {})
      for (const locale of [...locales, 'zh-TW'] as LocalesEnum[]) {
        const legacy = legacyTranslatePiece(JSON.parse(raw), locale)
        const actual = pieceTranslation.translatePiece({ piece: JSON.parse(raw), locale } as never)
        compared++
        if (JSON.stringify(actual) !== JSON.stringify(legacy)) mismatches.push(`${file}:${locale}`)
      }
    }
    console.log(`compared ${compared} (piece, locale) pairs across ${files.length} pieces`)
    expect(mismatches).toEqual([])
  }, 600000)
})
