import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  ApFile,
  DynamicPropsValue,
  MarkdownVariant,
  PieceAuth,
  Property,
  createAction,
  tryCatch,
} from '@activepieces/pieces-framework';
import Docxtemplater, { DXT } from 'docxtemplater';
import InspectModule from 'docxtemplater/js/inspect-module';
import PizZip from 'pizzip';
import { wordFile } from '../common/word-file';
import { fillTemplateActionOutputSchema } from '../output-schemas';

export const fillTemplate = createAction({
  auth: PieceAuth.None(),
  audience: 'both',
  name: 'fill_template',
  classification: 'READ',
  displayName: 'Fill Template',
  description:
    'Fill the {{placeholders}} in a Word template (.docx) and get a new document.',
  aiMetadata: {
    description:
      'Creates a new Word document (.docx) from a template by replacing its {{placeholders}} with values, keeping all formatting. Pass every value in data as one JSON object: nested values ({{customer.city}}), a list of objects to repeat a table row or paragraph per item ({{#items}}...{{/items}}), and true/false to show a section ({{#paid}}...{{/paid}}) or its opposite ({{^paid}}...{{/paid}}); fields only mirrors the template for the flow builder. Missing values come out blank. Use it to generate contracts, invoices, letters or certificates and pass the returned file to an email, storage or PDF step. The template itself is not changed, and the same inputs give the same document.',
    idempotent: true,
  },
  outputSchema: fillTemplateActionOutputSchema,
  props: {
    syntax: Property.MarkDown({
      value: `Type placeholders in your Word template with double braces:
- \`{{name}}\` is replaced by the "name" value. \`{{customer.city}}\` reads a nested value.
- \`{{#items}}\` ... \`{{/items}}\` repeats a table row or paragraph for each entry of the "items" list. Inside it, use the entry's fields, like \`{{description}}\`.
- \`{{#paid}}\` ... \`{{/paid}}\` shows the text only when "paid" is true; \`{{^paid}}\` ... \`{{/paid}}\` only when it is false or empty.`,
      variant: MarkdownVariant.INFO,
    }),
    template: Property.File({
      displayName: 'Word Template',
      description:
        'A .docx file with {{placeholders}}, from an earlier step or a URL.',
      required: true,
    }),
    fields: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Fields',
      description:
        'One field per placeholder in the template. They appear once the template is set, or mapped from a step you have tested.',
      required: false,
      refreshers: ['template'],
      props: async ({ template }) => templateFields(template),
    }),
    data: Property.Json({
      displayName: 'Data (JSON)',
      description:
        'Optional. A JSON object with values for the placeholders. It overrides the fields above, and is needed for a list inside a list.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description:
        "Name of the new document. Leave empty to use the template's name.",
      placeholder: 'contract.docx',
      required: false,
    }),
  },
  async run(context) {
    const { template, fields, data, fileName } = context.propsValue;
    const problem = findTemplateProblem(template.data);
    if (problem) {
      throw new Error(problem);
    }
    if (
      data !== undefined &&
      (typeof data !== 'object' || data === null || Array.isArray(data))
    ) {
      throw new Error(
        'Data must be a JSON object, for example {"name": "Ada Lovelace"}.'
      );
    }
    const values = mergeValues({ fields: fields ?? {}, data: data ?? {} });
    const { data: rendered, error } = await tryCatch(async () =>
      renderTemplate({ template: template.data, data: values })
    );
    if (error) {
      throw new Error(describeTemplateError(error));
    }
    const name = toFileName({
      requested: fileName?.trim() || template.filename,
      extension: rendered.extension,
    });
    return {
      file: await context.files.write({
        fileName: name,
        data: rendered.document,
      }),
      fileName: name,
    };
  },
});

function renderTemplate({
  template,
  data,
}: {
  template: Buffer;
  data: Record<string, unknown>;
}): RenderedDocument {
  const zip = new PizZip(template);
  const document = createTemplater({ zip, modules: [] });
  document.render(data);
  const contentTypes = zip.file(CONTENT_TYPES_PART)?.asText() ?? '';
  zip.file(
    CONTENT_TYPES_PART,
    contentTypes
      .replace(
        'wordprocessingml.template.main+xml',
        'wordprocessingml.document.main+xml'
      )
      .replace(
        'ms-word.template.macroEnabledTemplate.main+xml',
        'ms-word.document.macroEnabled.main+xml'
      )
  );
  return {
    document: zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }),
    extension: contentTypes.includes('macroEnabled') ? 'docm' : 'docx',
  };
}

async function templateFields(template: unknown): Promise<DynamicPropsValue> {
  const { data: document, error: loadError } = await tryCatch(async () =>
    loadTemplate(template)
  );
  if (loadError) {
    return fieldsNotice(
      loadError instanceof MissingTemplateError
        ? 'Set the Word Template above, or map it from a step you have tested, to see its fields here. You can also fill the template with Data (JSON).'
        : `The template could not be downloaded (${describeDownloadError(
            loadError
          )}). Check the URL, or map the file from a step you have tested.`
    );
  }
  const problem = findTemplateProblem(document);
  if (problem) {
    return fieldsNotice(problem);
  }
  const { data: tags, error } = await tryCatch(async () =>
    listTemplateTags(document)
  );
  if (error) {
    return fieldsNotice(describeTemplateError(error));
  }
  if (tags.length === 0) {
    return fieldsNotice('This template has no {{placeholders}} yet.');
  }
  if (tags.length > MAX_FIELDS) {
    return fieldsNotice(
      `This template has ${tags.length} placeholders, too many to show as fields. Fill it with Data (JSON) instead.`
    );
  }
  return Object.fromEntries(
    tags.map((tag) => [tag.name, toFieldProperty(tag)])
  );
}

function describeDownloadError(error: Error): string {
  if (error instanceof HttpError) {
    return `the server answered ${error.response.status}`;
  }
  return error.message.slice(0, 200);
}

function fieldsNotice(message: string): DynamicPropsValue {
  return {
    fieldsNotice: Property.MarkDown({
      value: message,
      variant: MarkdownVariant.WARNING,
    }),
  };
}

function findTemplateProblem(template: Buffer): string | undefined {
  if (wordFile.isEncryptedDocx(template)) {
    return 'This template is password-protected. Remove the password in Word, save it, and try again.';
  }
  if (wordFile.isLegacyDoc(template)) {
    return wordFile.legacyDocMessage;
  }
  if (wordFile.exceedsUnzippedLimits(template)) {
    return 'This template is too large to fill. Templates up to about 1,500 pages of text and 200 MB in total are supported.';
  }
  return undefined;
}

function listTemplateTags(template: Buffer): TemplateTag[] {
  const inspector = new InspectModule();
  createTemplater({ zip: new PizZip(template), modules: [inspector] });
  const tags = inspector
    .getAllStructuredTags()
    .filter(isPlaceholder)
    .flatMap(toTemplateTags);
  const byName = new Map<string, TemplateTag>();
  tags.forEach((tag) => {
    const current = byName.get(tag.name);
    if (current?.kind === 'list' && tag.kind === 'list') {
      byName.set(tag.name, {
        ...current,
        fields: [...new Set([...current.fields, ...tag.fields])],
      });
    } else if (
      !current ||
      TAG_PRIORITY[tag.kind] > TAG_PRIORITY[current.kind]
    ) {
      byName.set(tag.name, tag);
    }
  });
  return [...byName.values()];
}

function toTemplateTags(part: DXT.Part): TemplateTag[] {
  const name = part.value.trim();
  if (UNFILLABLE_NAMES.has(name)) {
    return [];
  }
  if (part.module !== 'loop') {
    return [{ name, kind: 'text', fields: [] }];
  }
  const inner = (part.subparsed ?? [])
    .filter((child) => isPlaceholder(child) && child.module !== 'loop')
    .map((child) => child.value.trim());
  const fields = [
    ...new Set(
      inner.filter((field) => !UNFILLABLE_NAMES.has(field) && field !== name)
    ),
  ];
  if (part.inverted) {
    return [
      { name, kind: 'condition', fields: [] },
      ...fields.map(
        (field): TemplateTag => ({ name: field, kind: 'text', fields: [] })
      ),
    ];
  }
  if (fields.length > 0) {
    return [{ name, kind: 'list', fields }];
  }
  if (inner.includes('.')) {
    return [{ name, kind: 'textList', fields: [] }];
  }
  return [
    { name, kind: inner.includes(name) ? 'text' : 'condition', fields: [] },
  ];
}

function isPlaceholder(part: DXT.Part): boolean {
  return part.type === 'placeholder';
}

function toFieldProperty(tag: TemplateTag): DynamicPropsValue[string] {
  if (tag.kind === 'condition') {
    return Property.Checkbox({
      displayName: tag.name,
      description: `Shows or hides the {{#${tag.name}}} section.`,
      required: false,
    });
  }
  if (tag.kind === 'textList') {
    return Property.Array({
      displayName: tag.name,
      description: `One entry per item for the {{#${tag.name}}} section.`,
      required: false,
    });
  }
  if (tag.kind === 'list') {
    return Property.Array({
      displayName: tag.name,
      description: `One row per item for the {{#${tag.name}}} section.`,
      required: false,
      properties: Object.fromEntries(
        tag.fields.map((field) => [
          field,
          Property.ShortText({ displayName: field, required: false }),
        ])
      ),
    });
  }
  return Property.ShortText({ displayName: tag.name, required: false });
}

async function loadTemplate(value: unknown): Promise<Buffer> {
  if (value instanceof ApFile) {
    return value.data;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MissingTemplateError();
  }
  const base64 = /^data:[^;]+;base64,(.+)$/.exec(value);
  if (base64) {
    return Buffer.from(base64[1], 'base64');
  }
  const response = await httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.GET,
    url: value,
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.body);
}

function mergeValues({
  fields,
  data,
}: {
  fields: Record<string, unknown>;
  data: Record<string, unknown>;
}): Record<string, unknown> {
  return Object.entries(fields)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
    .filter(([key]) => resolvePath({ scope: data, path: key }) === undefined)
    .reduce<Record<string, unknown>>(
      (merged, [key, value]) => ({ ...merged, [key]: value }),
      data
    );
}

function createTemplater({
  zip,
  modules,
}: {
  zip: PizZip;
  modules: DXT.Module[];
}): Docxtemplater<PizZip> {
  return new Docxtemplater(zip, {
    modules,
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
    stripInvalidXMLChars: true,
    errorLogging: false,
    syntax: { allowUnopenedTag: true, allowUnclosedTag: true },
    nullGetter: () => '',
    parser: (tag) => {
      const path = tag.trim();
      return {
        get: (scope, context) => {
          const value = resolvePath({ scope, path });
          return context.meta.part.module === 'loop' ? value : toText(value);
        },
      };
    },
  });
}

function resolvePath({
  scope,
  path,
}: {
  scope: unknown;
  path: string;
}): unknown {
  if (path === '.') {
    return scope;
  }
  return (
    readOwn({ value: scope, key: path }) ??
    path
      .split('.')
      .reduce<unknown>((value, key) => readOwn({ value, key }), scope)
  );
}

function readOwn({ value, key }: { value: unknown; key: string }): unknown {
  return typeof value === 'object' &&
    value !== null &&
    Object.hasOwn(value, key)
    ? Reflect.get(value, key)
    : undefined;
}

function toText(value: unknown): unknown {
  return typeof value === 'object' && value !== null
    ? JSON.stringify(value)
    : value;
}

function toFileName({
  requested,
  extension,
}: {
  requested: string;
  extension: string;
}): string {
  return `${requested.replace(/\.(docx|docm|dotx|dotm)$/i, '')}.${extension}`;
}

function describeTemplateError(error: Error): string {
  const explanations = getTemplateErrorExplanations(error);
  if (
    explanations.length > 0 &&
    !hasErrorId({ error, id: 'filetype_not_identified' })
  ) {
    return `The template has a mistake in its placeholders: ${explanations.join(
      ' '
    )}`;
  }
  return `This file could not be read as a Word document (.docx). It may be damaged or in a different format. Details: ${error.message}`;
}

function hasErrorId({ error, id }: { error: unknown; id: string }): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'properties' in error &&
    typeof error.properties === 'object' &&
    error.properties !== null &&
    'id' in error.properties &&
    error.properties.id === id
  );
}

function getTemplateErrorExplanations(error: unknown): string[] {
  if (typeof error !== 'object' || error === null || !('properties' in error)) {
    return [];
  }
  const { properties } = error;
  if (typeof properties !== 'object' || properties === null) {
    return [];
  }
  if ('errors' in properties && Array.isArray(properties.errors)) {
    return properties.errors.flatMap(getTemplateErrorExplanations);
  }
  if (
    'explanation' in properties &&
    typeof properties.explanation === 'string'
  ) {
    return [properties.explanation];
  }
  return [];
}

const CONTENT_TYPES_PART = '[Content_Types].xml';

class MissingTemplateError extends Error {}

const MAX_FIELDS = 200;

const UNFILLABLE_NAMES = new Set(['', '.', '__proto__']);

const TAG_PRIORITY: Record<TemplateTagKind, number> = {
  list: 3,
  textList: 2,
  condition: 1,
  text: 0,
};

type TemplateTagKind = 'text' | 'list' | 'textList' | 'condition';

type TemplateTag = {
  name: string;
  kind: TemplateTagKind;
  fields: string[];
};

type RenderedDocument = {
  document: Buffer;
  extension: 'docx' | 'docm';
};
