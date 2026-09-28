import { createAction, OutputSchema, Property, tryCatch } from '@activepieces/pieces-framework';
import { XMLBuilder, XMLValidator } from 'fast-xml-parser';

export const createXml = createAction({
  audience: 'both',
  name: 'create-xml',
  classification: 'READ',
  displayName: 'Create XML',
  description: 'Build an XML document from JSON, with attributes, repeated elements, CDATA and an optional XML declaration',
  aiMetadata: {
    description: 'Builds a well-formed XML string from a JSON object or array: each key becomes an element, each array item becomes a repeated element with the same name, keys prefixed "@_" become attributes of their parent element (including namespace declarations such as "@_xmlns:soap"), "#text" sets the text of an element that also has attributes, and "#cdata" writes a CDATA section. This is the same JSON shape that Convert XML to JSON returns, so the two actions round-trip. Use it to produce a SOAP envelope, legacy API payload, RSS feed, sitemap or file body; prefer it over Convert JSON to XML, which merges list items into one element. A top-level array or several top-level keys are wrapped in one root element ("root" unless Root Element is set). Fails with the offending key and line number when a key is not a valid XML name, and fails when the JSON is nested more than 100 levels deep. Deterministic and idempotent.',
    idempotent: true,
  },
  outputSchema: createXmlOutputSchema(),
  props: {
    json: Property.Json({
      displayName: 'JSON',
      description: 'Each key becomes an element and each list item becomes a repeated element. Keys starting with "@_" become attributes, "#text" sets the text of an element that has attributes, and "#cdata" writes a CDATA section. Example: {"book": {"@_id": "1", "title": "Dune", "tag": ["scifi", "classic"]}}. The output of Convert XML to JSON can be used as-is.',
      required: true,
    }),
    rootElement: Property.ShortText({
      displayName: 'Root Element',
      description: 'Wraps the output in one element with this name. Leave empty if your JSON already has a single top-level key. If the JSON is a list or has several top-level keys and this is empty, "root" is used.',
      required: false,
    }),
    listItemElement: Property.ShortText({
      displayName: 'List Item Element',
      description: 'Element name for each item when the JSON itself is a list. Defaults to "item".',
      required: false,
    }),
    prettyPrint: Property.Checkbox({
      displayName: 'Pretty Print',
      description: 'Put each element on its own line; text content is never changed.',
      required: false,
      defaultValue: false,
    }),
    includeDeclaration: Property.Checkbox({
      displayName: 'Include XML Declaration',
      description: 'Start the output with <?xml version="1.0" encoding="UTF-8"?>. To use a different declaration, add a "?xml" key to your JSON instead, e.g. {"?xml": {"@_version": "1.0", "@_standalone": "yes"}}.',
      required: false,
      defaultValue: false,
    }),
    selfCloseEmptyElements: Property.Checkbox({
      displayName: 'Self-Close Empty Elements',
      description: 'Write empty values as <tag/> instead of <tag></tag>.',
      required: false,
      defaultValue: false,
    }),
    attributePrefix: Property.ShortText({
      displayName: 'Attribute Prefix',
      description: 'Keys starting with this prefix become attributes. Defaults to "@_", the prefix Convert XML to JSON uses.',
      required: false,
    }),
    textKey: Property.ShortText({
      displayName: 'Text Key',
      description: 'Key that holds the text of an element that also has attributes. Defaults to "#text".',
      required: false,
    }),
    cdataKey: Property.ShortText({
      displayName: 'CDATA Key',
      description: 'Key whose value is written as a CDATA section, so it is not escaped. Defaults to "#cdata".',
      required: false,
    }),
  },
  async run(context) {
    const { json, rootElement, listItemElement, prettyPrint, includeDeclaration, selfCloseEmptyElements } = context.propsValue;
    const keys: SpecialKeys = {
      attributePrefix: context.propsValue.attributePrefix || DEFAULT_ATTRIBUTE_PREFIX,
      textKey: context.propsValue.textKey || DEFAULT_TEXT_KEY,
      cdataKey: context.propsValue.cdataKey || DEFAULT_CDATA_KEY,
    };
    const format = { keys, selfClose: selfCloseEmptyElements ?? false };
    const document = toDocument({
      json,
      rootElement: rootElement?.trim() || undefined,
      listItemElement: listItemElement?.trim() || DEFAULT_LIST_ITEM_ELEMENT,
      keys,
    });
    const { data: built, error: buildError } = await tryCatch(async () => buildDocument({ document, format, pretty: prettyPrint ?? false }));
    if (buildError) {
      throw new InvalidXmlError(
        buildError.message === MAX_DEPTH_MESSAGE
          ? `The JSON is nested more than ${MAX_DEPTH} levels deep, which is the most Create XML and Convert XML to JSON accept. Flatten the data or split it into smaller documents.`
          : `The JSON could not be turned into XML: ${buildError.message}`,
      );
    }
    const xml = built.trim();
    const validation = XMLValidator.validate(xml);
    if (validation !== true) {
      const problem = findInvalidName({ value: document, path: '', keys });
      throw new InvalidXmlError(
        `The JSON does not produce valid XML: ${problem ? `${problem} ` : ''}${validation.err.msg} (line ${validation.err.line}). Element and attribute names must start with a letter or "_" and can only contain letters, digits, "-", "_", "." and ":".`,
      );
    }
    if (!includeDeclaration || XML_DECLARATION_START.test(xml)) {
      return xml;
    }
    return `${XML_DECLARATION}${prettyPrint ? '\n' : ''}${xml}`;
  },
});

function buildDocument({ document, format, pretty }: { document: Record<string, unknown>; format: BuildFormat; pretty: boolean }): string {
  if (!pretty) {
    return String(createBuilder({ format, pretty: false, maxDepth: MAX_DEPTH }).build(document));
  }
  const token = inlineToken({ document });
  const { value, inlined } = inlineMixedChildren({ node: document, format, token, depth: 1, offset: 0 });
  const xml = String(createBuilder({ format, pretty: true, maxDepth: MAX_DEPTH }).build(value));
  return xml.replace(new RegExp(`${token}(\\d+)_`, 'g'), (_match, index: string) => inlined[Number(index)]);
}

function createBuilder({ format, pretty, maxDepth }: { format: BuildFormat; pretty: boolean; maxDepth: number }): XMLBuilder {
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: format.keys.attributePrefix,
    textNodeName: format.keys.textKey,
    cdataPropName: format.keys.cdataKey,
    format: pretty,
    indentBy: '  ',
    suppressEmptyNode: format.selfClose,
    suppressBooleanAttributes: false,
    processEntities: true,
    maxNestedTags: maxDepth,
  });
}

function inlineMixedChildren({ node, format, token, depth, offset }: InlineParams): InlineResult {
  const entries: [string, unknown][] = [];
  const inlined: string[] = [];
  for (const [key, child] of Object.entries(node)) {
    if (!isElementKey({ key, keys: format.keys }) || key.startsWith('?')) {
      entries.push([key, child]);
      continue;
    }
    const inner = inlineElement({ name: key, value: child, format, token, depth, offset: offset + inlined.length });
    entries.push([key, inner.value]);
    inlined.push(...inner.inlined);
  }
  return { value: Object.fromEntries(entries), inlined };
}

function inlineElement({ name, value, format, token, depth, offset }: InlineElementParams): { value: unknown; inlined: string[] } {
  if (Array.isArray(value)) {
    const items: unknown[] = [];
    const inlined: string[] = [];
    for (const item of value) {
      const inner = inlineElement({ name, value: item, format, token, depth, offset: offset + inlined.length });
      items.push(inner.value);
      inlined.push(...inner.inlined);
    }
    return { value: items, inlined };
  }
  if (!isRecord(value) || depth > MAX_DEPTH) {
    return { value, inlined: [] };
  }
  if (!isMixedContent({ value, keys: format.keys })) {
    return inlineMixedChildren({ node: value, format, token, depth: depth + 1, offset });
  }
  const attributes = Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith(format.keys.attributePrefix)));
  const content = Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith(format.keys.attributePrefix)));
  const element = String(createBuilder({ format, pretty: false, maxDepth: MAX_DEPTH - depth + 1 }).build({ [name]: content }));
  const inner = element.slice(`<${name}>`.length, element.length - `</${name}>`.length);
  return { value: { ...attributes, [format.keys.textKey]: `${token}${offset}_` }, inlined: [inner] };
}

function isMixedContent({ value, keys }: { value: Record<string, unknown>; keys: SpecialKeys }): boolean {
  if (keys.cdataKey in value) {
    return true;
  }
  const text = value[keys.textKey];
  const hasText = text !== undefined && text !== null && text !== '';
  return hasText && Object.keys(value).some((key) => isElementKey({ key, keys }));
}

function inlineToken({ document }: { document: Record<string, unknown> }): string {
  const serialized = JSON.stringify(document);
  const suffixes = Array.from({ length: 10 }, (_, index) => 'x'.repeat(index));
  const free = suffixes.find((suffix) => !serialized.includes(`${INLINE_TOKEN}${suffix}`)) ?? suffixes[suffixes.length - 1];
  return `${INLINE_TOKEN}${free}`;
}

function toDocument({ json, rootElement, listItemElement, keys }: ToDocumentParams): Record<string, unknown> {
  if (Array.isArray(json)) {
    return { [rootElement ?? DEFAULT_ROOT_ELEMENT]: { [listItemElement]: json } };
  }
  if (!isRecord(json)) {
    return { [rootElement ?? DEFAULT_ROOT_ELEMENT]: json ?? '' };
  }
  const entries = Object.entries(json).sort(([a], [b]) => Number(b === XML_DECLARATION_KEY) - Number(a === XML_DECLARATION_KEY));
  const instructions = entries.filter(([key]) => key.startsWith('?'));
  const nodes = entries.filter(([key]) => !key.startsWith('?'));
  const hasSingleRoot = nodes.length === 1 && !Array.isArray(nodes[0][1]) && isElementKey({ key: nodes[0][0], keys });
  if (!rootElement && hasSingleRoot) {
    return Object.fromEntries([...instructions, ...nodes]);
  }
  return {
    ...Object.fromEntries(instructions),
    [rootElement ?? DEFAULT_ROOT_ELEMENT]: Object.fromEntries(nodes),
  };
}

function isElementKey({ key, keys }: { key: string; keys: SpecialKeys }): boolean {
  return !key.startsWith(keys.attributePrefix) && key !== keys.textKey && key !== keys.cdataKey;
}

function findInvalidName({ value, path, keys }: { value: unknown; path: string; keys: SpecialKeys }): string | undefined {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const itemPath = `${path}[${index}]`;
      if (Array.isArray(item)) {
        return `The list at ${itemPath} sits directly inside another list, so it has no element name; wrap it in an object such as {"row": [...]}.`;
      }
      const found = findInvalidName({ value: item, path: itemPath, keys });
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    const isAttribute = key.startsWith(keys.attributePrefix);
    const name = isAttribute ? key.slice(keys.attributePrefix.length) : key.replace(/^\?/, '');
    if (key !== keys.textKey && key !== keys.cdataKey && !XML_NAME.test(name)) {
      return `"${name}" at ${childPath} is not a valid XML ${isAttribute ? 'attribute' : 'element'} name.`;
    }
    const found = isAttribute ? undefined : findInvalidName({ value: child, path: childPath, keys });
    if (found) {
      return found;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createXmlOutputSchema(): OutputSchema {
  return {
    fields: [{ key: 'xml', label: 'XML', value: '', description: 'The XML document built from the JSON input.' }],
  };
}

class InvalidXmlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidXmlError';
  }
}

const DEFAULT_ATTRIBUTE_PREFIX = '@_';
const DEFAULT_TEXT_KEY = '#text';
const DEFAULT_CDATA_KEY = '#cdata';
const DEFAULT_ROOT_ELEMENT = 'root';
const DEFAULT_LIST_ITEM_ELEMENT = 'item';
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const MAX_DEPTH = 100;
const XML_DECLARATION_KEY = '?xml';
const XML_DECLARATION_START = /^<\?xml[\s?]/;
const INLINE_TOKEN = 'apinlinexml';
const MAX_DEPTH_MESSAGE = 'Maximum nested tags exceeded';
const NAME_START_CHARS = ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const XML_NAME = new RegExp(`^[${NAME_START_CHARS}][${NAME_START_CHARS}\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`);

type SpecialKeys = {
  attributePrefix: string;
  textKey: string;
  cdataKey: string;
};

type BuildFormat = {
  keys: SpecialKeys;
  selfClose: boolean;
};

type InlineResult = {
  value: Record<string, unknown>;
  inlined: string[];
};

type InlineParams = {
  node: Record<string, unknown>;
  format: BuildFormat;
  token: string;
  depth: number;
  offset: number;
};

type InlineElementParams = {
  name: string;
  value: unknown;
  format: BuildFormat;
  token: string;
  depth: number;
  offset: number;
};

type ToDocumentParams = {
  json: unknown;
  rootElement: string | undefined;
  listItemElement: string;
  keys: SpecialKeys;
};
