import { tryCatch } from '@activepieces/pieces-framework';
import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFString,
} from 'pdf-lib';

export const xfaTemplate = {
  readLabels,
};

async function readLabels(
  document: PDFDocument
): Promise<Map<string, string | null>> {
  const template = await readTemplate(document);
  return template === null ? new Map() : parseLabels(template);
}

async function readTemplate(document: PDFDocument): Promise<string | null> {
  const xfa = document.catalog
    .lookupMaybe(PDFName.of('AcroForm'), PDFDict)
    ?.lookup(PDFName.of('XFA'));
  if (xfa instanceof PDFRawStream) {
    return decodeStream(xfa);
  }
  if (!(xfa instanceof PDFArray)) {
    return null;
  }
  const nameIndex = Array.from(
    { length: Math.floor(xfa.size() / 2) },
    (_, pair) => pair * 2
  ).find((index) => isTemplateName(xfa.lookup(index)));
  if (nameIndex === undefined) {
    return null;
  }
  const part = xfa.lookup(nameIndex + 1);
  return part instanceof PDFRawStream ? decodeStream(part) : null;
}

function isTemplateName(value: unknown): boolean {
  return (
    (value instanceof PDFString || value instanceof PDFHexString) &&
    value.decodeText() === 'template'
  );
}

async function decodeStream(stream: PDFRawStream): Promise<string | null> {
  const { data } = await tryCatch(async () =>
    new TextDecoder().decode(decodePDFRawStream(stream).decode())
  );
  return data;
}

function parseLabels(xml: string): Map<string, string | null> {
  const labels = new Map<string, string | null>();
  const stack: Frame[] = [];
  for (const token of tokenize(xml)) {
    if (token.kind === 'text') {
      const target = textTarget(stack);
      if (target !== null) {
        target.field.text[target.part] += token.text;
      }
    } else if (token.kind === 'close') {
      const field = stack.pop()?.field;
      if (field?.path) {
        labels.set(field.path, pickLabel(field));
      }
    } else if (stack.at(-1)?.hidden || localName(token.tag) === 'proto') {
      if (!token.selfClosing) {
        stack.push(HIDDEN_FRAME);
      }
    } else if (stack.length > 0 || localName(token.tag) === 'template') {
      const tag = localName(token.tag);
      const name = readName(token.attributes);
      const scope = stack.length === 0 ? null : nearestScope(stack);
      const index = scope && name !== null ? scope.siblings.get(name) ?? 0 : 0;
      const path =
        scope && name !== null && SOM_CONTAINERS.has(tag)
          ? joinPath({ parent: scope.path, step: `${name}[${index}]` })
          : null;
      if (scope && path !== null && name !== null) {
        scope.siblings.set(name, index + 1);
      }
      const target = BREAK_TAGS.has(tag) ? textTarget(stack) : null;
      if (target !== null) {
        target.field.text[target.part] += ' ';
      }
      const frame: Frame = {
        scope:
          stack.length === 0
            ? { path: '', siblings: new Map() }
            : path === null
            ? null
            : { path, siblings: new Map() },
        field: FIELD_TAGS.has(tag)
          ? { path, text: { toolTip: '', caption: '', speak: '' } }
          : null,
        part: nearestField(stack) === null ? null : toLabelPart(tag),
        hidden: false,
      };
      if (!token.selfClosing) {
        stack.push(frame);
      } else if (frame.field?.path) {
        labels.set(frame.field.path, null);
      }
    }
  }
  return labels;
}

function textTarget(
  stack: Frame[]
): { field: FieldText; part: LabelPart } | null {
  const fromTop = [...stack].reverse();
  const fieldDepth = fromTop.findIndex((frame) => frame.field !== null);
  const field = fieldDepth < 0 ? null : fromTop[fieldDepth].field;
  const part =
    fromTop.slice(0, fieldDepth).find((frame) => frame.part !== null)?.part ??
    null;
  return field && part ? { field, part } : null;
}

function pickLabel(field: FieldText): string | null {
  return (
    LABEL_PARTS.map((part) => clean(field.text[part])).find((text) =>
      WORD_PATTERN.test(text)
    ) ?? null
  );
}

function toLabelPart(tag: string): LabelPart | null {
  return LABEL_PARTS.find((part) => part === tag) ?? null;
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function joinPath({ parent, step }: { parent: string; step: string }): string {
  return parent === '' ? step : `${parent}.${step}`;
}

function nearestScope(stack: Frame[]): Scope | null {
  return (
    [...stack].reverse().find((frame) => frame.scope !== null)?.scope ?? null
  );
}

function nearestField(stack: Frame[]): FieldText | null {
  return (
    [...stack].reverse().find((frame) => frame.field !== null)?.field ?? null
  );
}

function readName(attributes: string): string | null {
  const match = NAME_PATTERN.exec(attributes);
  if (!match) {
    return null;
  }
  return decodeEntities(match[1] ?? match[2] ?? '');
}

function localName(tag: string): string {
  return tag.slice(tag.indexOf(':') + 1);
}

function* tokenize(xml: string): Generator<Token> {
  for (const match of xml.matchAll(TOKEN_PATTERN)) {
    const [, cdata, slash, tag, attributes, selfClosing, text] = match;
    if (cdata !== undefined) {
      yield { kind: 'text', text: cdata };
    } else if (tag !== undefined) {
      yield slash
        ? { kind: 'close' }
        : {
            kind: 'open',
            tag,
            attributes: attributes ?? '',
            selfClosing: selfClosing === '/',
          };
    } else if (text !== undefined) {
      yield { kind: 'text', text: decodeEntities(text) };
    }
  }
}

function decodeEntities(text: string): string {
  return text.replace(ENTITY_PATTERN, (entity, body: string) => {
    if (body.startsWith('#')) {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return code <= MAX_CODE_POINT ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[body] ?? entity;
  });
}

const TOKEN_PATTERN =
  /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<[?!][^>]*>|<(\/?)([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)|</g;

const NAME_PATTERN = /(?:^|\s)name\s*=\s*(?:"([^"]*)"|'([^']*)')/;

const ENTITY_PATTERN = /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

const MAX_CODE_POINT = 0x10ffff;

const SOM_CONTAINERS = new Set(['subform', 'field', 'exclGroup']);

const FIELD_TAGS = new Set(['field', 'exclGroup']);

const BREAK_TAGS = new Set(['p', 'br', 'div', 'li']);

const HIDDEN_FRAME: Frame = {
  scope: null,
  field: null,
  part: null,
  hidden: true,
};

const LABEL_PARTS: LabelPart[] = ['toolTip', 'caption', 'speak'];

const WORD_PATTERN = /\p{L}{2}/u;

type Scope = { path: string; siblings: Map<string, number> };

type LabelPart = 'toolTip' | 'caption' | 'speak';

type FieldText = { path: string | null; text: Record<LabelPart, string> };

type Frame = {
  scope: Scope | null;
  field: FieldText | null;
  part: LabelPart | null;
  hidden: boolean;
};

type Token =
  | { kind: 'open'; tag: string; attributes: string; selfClosing: boolean }
  | { kind: 'close' }
  | { kind: 'text'; text: string };
