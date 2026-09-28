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

const prop = (displayName: string, description: string, labels: string[] = []): TestProp => ({
  displayName,
  description,
  required: false,
  type: 'SHORT_TEXT',
  ...(labels.length > 0 ? { options: { options: labels.map((label, i) => ({ label, value: `v${i}` })) } } : {}),
})

const fixtures: TestPiece[] = [
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
        const legacy = legacyTranslatePiece(clone(fixture), locale)
        const actual = translate({ piece: clone(fixture), locale })
        expect(JSON.stringify(actual)).toEqual(JSON.stringify(legacy))
      }
    }
  })

  it('leaves the input untouched', () => {
    for (const fixture of fixtures) {
      const input = clone(fixture)
      translate({ piece: input, locale: DE })
      expect(input).toEqual(clone(fixture))
    }
  })

  it('keeps option arrays as arrays', () => {
    const translated = translate({ piece: clone(fixtureNamed('options-arrays')), locale: DE })
    const options = translated.actions.act.props.field.options?.options ?? []
    expect(Array.isArray(options)).toBe(true)
    expect(options.map((option) => option.label)).toEqual(['Alfa', 'Beta-DE', 'Untranslated'])
  })

  it('shares untouched subtrees with the source instead of copying them', () => {
    const input = clone(fixtureNamed('missing-and-odd-leaves'))
    const translated = translate({ piece: input, locale: DE })
    expect(translated.actions.a1.props).toBe(input.actions.a1.props)
    expect(translated.triggers).toBe(input.triggers)
    expect(translated.actions.a2.props.p.displayName).toEqual('Pe')
  })

  it('never translates a value that is itself a translation key', () => {
    const piece: TestPiece = {
      name: 'chained', displayName: 'Chained', description: 'Name',
      actions: {
        act: {
          name: 'act', displayName: 'Name', description: 'Name', requireAuth: false,
          props: { field: prop('Name', 'Name') },
        },
      },
      triggers: {},
      i18n: { [DE]: { 'Name': 'Nom', 'Nom': 'Nombre' } },
    }
    const translated = translate({ piece, locale: DE })
    expect(translated.actions.act.displayName).toEqual('Nom')
    expect(translated.actions.act.props.field.displayName).toEqual('Nom')
  })

  it('does not resolve a value to an inherited property of the translations', () => {
    const piece: TestPiece = { name: 'inherited', displayName: 'Inherited', description: 'constructor', actions: {}, triggers: {} }
    const translated = pieceTranslation.translatePiece({ piece, translations: {} })
    expect(translated.description).toEqual('constructor')
  })
})

const corpus = process.env.PIECE_CORPUS_DIR
describe.skipIf(!corpus)('translatePiece copy-on-write against a real catalogue', () => {
  it('matches the JSON-clone implementation for every piece and locale', () => {
    const files = fs.readdirSync(corpus ?? '')
    const mismatches: string[] = []
    let compared = 0
    for (const file of files) {
      const raw = fs.readFileSync(path.join(corpus ?? '', file), 'utf8')
      const parsed: TestPiece = JSON.parse(raw)
      const locales = Object.keys(parsed.i18n ?? {})
      for (const locale of [...locales, LocalesEnum.CHINESE_TRADITIONAL] as LocalesEnum[]) {
        const legacy = legacyTranslatePiece(JSON.parse(raw), locale)
        const actual = translate({ piece: JSON.parse(raw), locale })
        compared++
        if (JSON.stringify(actual) !== JSON.stringify(legacy)) mismatches.push(`${file}:${locale}`)
      }
    }
    console.log(`compared ${compared} (piece, locale) pairs across ${files.length} pieces`)
    expect(mismatches).toEqual([])
  }, 600000)
})

function translate({ piece, locale }: { piece: TestPiece, locale: LocalesEnum }): TestPiece {
  return pieceTranslation.translatePiece({ piece, translations: piece.i18n?.[locale] })
}

function clone(piece: TestPiece): TestPiece {
  return JSON.parse(JSON.stringify(piece))
}

function fixtureNamed(name: string): TestPiece {
  const fixture = fixtures.find((candidate) => candidate.name === name)
  if (!fixture) {
    throw new Error(`no fixture named ${name}`)
  }
  return fixture
}

type TestProp = {
  displayName: string
  description?: string
  required: boolean
  type: string
  options?: { options: { label: string, value: string }[] }
}

type TestComponent = {
  name: string
  displayName: string
  description?: string
  requireAuth: boolean
  props: Record<string, TestProp>
}

type TestPiece = {
  name: string
  displayName: string
  description: string
  auth?: unknown
  actions: Record<string, TestComponent>
  triggers: Record<string, TestComponent>
  i18n?: Partial<Record<string, Record<string, string>>>
}
