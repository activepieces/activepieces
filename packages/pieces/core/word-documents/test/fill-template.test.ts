/// <reference types="vitest/globals" />

import { readFileSync } from 'fs';
import { join } from 'path';
import PizZip from 'pizzip';
import { OfficeParser } from 'officeparser';
import { fillTemplate } from '../src/lib/actions/fill-template';
import {
  createMockActionContext,
  ApFile,
} from '@activepieces/pieces-framework';

async function runFill({
  template,
  data,
  fields,
  fileName,
  templateName = 'template.docx',
}: RunFillParams) {
  const written: { fileName: string; data: Buffer }[] = [];
  const context = createMockActionContext<typeof fillTemplate.props>({
    propsValue: {
      template: new ApFile(templateName, template, 'docx'),
      data,
      fields,
      fileName,
      syntax: undefined,
    },
  });
  const result = await fillTemplate.run({
    ...context,
    files: {
      ...context.files,
      write: async ({ fileName: name, data: content }) => {
        if (!Buffer.isBuffer(content)) {
          throw new Error('Expected the document as a Buffer');
        }
        written.push({ fileName: name, data: content });
        return 'file-url';
      },
    },
  });
  return { result, document: written[0].data };
}

function propertyContext() {
  return createMockActionContext<typeof fillTemplate.props>({
    propsValue: {
      template: new ApFile('template.docx', Buffer.alloc(0), 'docx'),
      fields: undefined,
      data: undefined,
      fileName: undefined,
      syntax: undefined,
    },
  });
}

async function listFields(template: Buffer) {
  const context = propertyContext();
  const props = await fillTemplate.props.fields.props(
    { template: new ApFile('template.docx', template, 'docx') },
    context
  );
  return Object.fromEntries(
    Object.entries(props).map(([key, property]) => [
      key,
      'properties' in property && property.properties
        ? `${property.type}[${Object.keys(property.properties).join(',')}]`
        : property.type,
    ])
  );
}

async function fieldsNotice(template: unknown): Promise<string> {
  const context = propertyContext();
  const props = await fillTemplate.props.fields.props({ template }, context);
  const notice = props['fieldsNotice'];
  return notice && 'description' in notice ? String(notice.description) : '';
}

function addParagraphs(paragraphs: string[]): Buffer {
  return editTemplate({
    part: 'word/document.xml',
    edit: (xml) =>
      xml.replace(
        '<w:body>',
        `<w:body>${paragraphs
          .map(
            (text) =>
              `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
          )
          .join('')}`
      ),
  });
}

async function readText(document: Buffer): Promise<string> {
  const ast = await OfficeParser.parseOffice(document, { fileType: 'docx' });
  const { value } = await ast.to('text', { includeImages: false });
  return (
    [...(ast.auxiliary?.headers ?? []), ...(ast.auxiliary?.footers ?? [])]
      .map((node) => node.text)
      .join('\n') +
    '\n' +
    value
  );
}

function fixture(name: string): Buffer {
  return readFileSync(join(__dirname, 'data', name));
}

function editTemplate({
  part,
  edit,
}: {
  part: string;
  edit: (xml: string) => string;
}): Buffer {
  const zip = new PizZip(fixture('template.docx'));
  zip.file(part, edit(zip.file(part)?.asText() ?? ''));
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const data = JSON.parse(
  readFileSync(join(__dirname, 'data', 'template-data.json'), 'utf8')
);

describe('fillTemplate', () => {
  test('fills placeholders, loops, conditions, headers, footers and footnotes', async () => {
    const { result, document } = await runFill({
      template: fixture('template.docx'),
      data,
    });
    expect(result).toEqual({ file: 'file-url', fileName: 'template.docx' });
    const text = await readText(document);
    for (const expected of [
      'HEADER:Acme',
      'FOOTER:Acme',
      'SPLIT:Ada',
      'MISSING:[]',
      'ZERO:0 FALSE:false NULL:[]',
      `SPECIAL:Tom & Jerry <b> "q" 'a' 😀 مرحبا`,
      'NESTED:Paris',
      'SPACEKEY:SpaceAda',
      'PROTO:[]',
      'LITERAL:{"json": {"a": 1}} and {single}',
      'ELSE_RIGHT',
      'red;blue;',
      'TEXTBOX:Acme',
      'SDT:Acme',
      /Widget\s*\|\s*2/,
      /Gadget\s*\|\s*5/,
      /ORDER:O2\s+LINE:S3/,
    ]) {
      expect(text).toMatch(expected);
    }
    for (const unexpected of [
      'IF_FALSE_SHOULD_HIDE',
      'EMPTY_ROW_SHOULD_VANISH',
      'ELSE_WRONG',
    ]) {
      expect(text).not.toContain(unexpected);
    }
    expect(new PizZip(document).file('word/footnotes.xml')?.asText()).toContain(
      'FOOTNOTE:Acme'
    );
  });

  test('prints objects as JSON instead of [object Object]', async () => {
    const { document } = await runFill({
      template: fixture('template.docx'),
      data: { ...data, company: { name: 'Acme' } },
    });
    expect(await readText(document)).toContain('TEXTBOX:{"name":"Acme"}');
  });

  test('turns a .dotx template into a .docx document', async () => {
    const template = editTemplate({
      part: '[Content_Types].xml',
      edit: (xml) =>
        xml.replace(
          'wordprocessingml.document.main+xml',
          'wordprocessingml.template.main+xml'
        ),
    });
    const { result, document } = await runFill({
      template,
      data,
      templateName: 'letter.dotx',
      fileName: 'Contract',
    });
    expect(result).toMatchObject({ fileName: 'Contract.docx' });
    expect(
      new PizZip(document).file('[Content_Types].xml')?.asText()
    ).toContain('wordprocessingml.document.main+xml');
  });

  test('keeps macro-enabled templates as .docm', async () => {
    const template = editTemplate({
      part: '[Content_Types].xml',
      edit: (xml) =>
        xml.replace(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
          'application/vnd.ms-word.template.macroEnabledTemplate.main+xml'
        ),
    });
    const { result, document } = await runFill({
      template,
      data,
      templateName: 'letter.dotm',
      fileName: 'letter.docx',
    });
    expect(result).toMatchObject({ fileName: 'letter.docm' });
    expect(
      new PizZip(document).file('[Content_Types].xml')?.asText()
    ).toContain('ms-word.document.macroEnabled.main+xml');
  });

  test('explains a broken loop in the template', async () => {
    const template = editTemplate({
      part: 'word/document.xml',
      edit: (xml) => xml.replace('{{/items}}', ''),
    });
    await expect(runFill({ template, data })).rejects.toThrow(
      'The template has a mistake in its placeholders: The loop with tag "items" is unclosed'
    );
  });

  test('lists a field for each placeholder in the template', async () => {
    expect(await listFields(fixture('template.docx'))).toMatchObject({
      company: 'SHORT_TEXT',
      'customer.city': 'SHORT_TEXT',
      'First Name': 'SHORT_TEXT',
      paid: 'CHECKBOX',
      unpaid: 'CHECKBOX',
      items: 'ARRAY[name,qty]',
      tags: 'ARRAY',
      orders: 'ARRAY[id]',
    });
  });

  test('keeps list rows when a list has an empty-list fallback, and merges list columns', async () => {
    const fields = await listFields(
      addParagraphs([
        '{{#items}}{{sku}}{{/items}}{{^items}}No items{{/items}}',
        '{{#paid}}PAID{{/paid}}{{^paid}}Due by {{due_date}}{{/paid}}',
        '{{__proto__}}',
      ])
    );
    expect(fields).toMatchObject({
      items: 'ARRAY[sku,name,qty]',
      paid: 'CHECKBOX',
      due_date: 'SHORT_TEXT',
    });
    expect(Object.hasOwn(fields, '__proto__')).toBe(false);
  });

  test('explains why fields are missing', async () => {
    expect(await fieldsNotice(undefined)).toContain(
      'Set the Word Template above'
    );
    expect(
      await fieldsNotice(
        new ApFile('t.docx', fixture('password-protected.docx'), 'docx')
      )
    ).toContain('password-protected');
    const broken = editTemplate({
      part: 'word/document.xml',
      edit: (xml) => xml.replace('{{/items}}', ''),
    });
    expect(await fieldsNotice(new ApFile('t.docx', broken, 'docx'))).toContain(
      'The loop with tag "items" is unclosed'
    );
    const crowded = addParagraphs(
      Array.from({ length: 201 }, (_, index) => `{{field_${index}}}`)
    );
    expect(await fieldsNotice(new ApFile('t.docx', crowded, 'docx'))).toContain(
      'too many to show as fields'
    );
  });

  test('fills from fields, and data overrides them without empty fields getting in the way', async () => {
    const { document } = await runFill({
      template: fixture('template.docx'),
      data: { first_name: 'FromJson', customer: { city: 'Rome' } },
      fields: {
        first_name: 'FromField',
        'customer.city': 'FromField',
        company: 'FieldCo',
        items: [{ name: 'FieldRow', qty: '7' }],
      },
    });
    const text = await readText(document);
    expect(text).toContain('SPLIT:FromJson');
    expect(text).toContain('NESTED:Rome');
    expect(text).toContain('TEXTBOX:FieldCo');
    expect(text).toMatch(/FieldRow\s*\|\s*7/);
  });

  test('rejects templates that unzip to more than the size limit', async () => {
    const bomb = editTemplate({
      part: 'word/document.xml',
      edit: (xml) =>
        xml.replace(
          '<w:body>',
          `<w:body><!--${'0'.repeat(9 * 1024 * 1024)}-->`
        ),
    });
    expect(bomb.length).toBeLessThan(200 * 1024);
    await expect(runFill({ template: bomb, data })).rejects.toThrow(
      'This template is too large to fill.'
    );
  });

  test('rejects data that is not a JSON object', async () => {
    await expect(
      runFill({
        template: fixture('template.docx'),
        data: JSON.parse('[{"name": "Ada"}]'),
      })
    ).rejects.toThrow('Data must be a JSON object');
  });

  test('rejects password-protected templates', async () => {
    await expect(
      runFill({ template: fixture('password-protected.docx'), data })
    ).rejects.toThrow('This template is password-protected.');
  });

  test('rejects legacy .doc templates with a save-as hint', async () => {
    const legacyDoc = Buffer.concat([
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      Buffer.alloc(504),
    ]);
    await expect(runFill({ template: legacyDoc, data })).rejects.toThrow(
      'save it as .docx'
    );
  });

  test('rejects files that are not Word documents', async () => {
    await expect(
      runFill({ template: Buffer.from('plain text, not a document'), data })
    ).rejects.toThrow(
      'This file could not be read as a Word document (.docx).'
    );
  });
});

type RunFillParams = {
  template: Buffer;
  data: Record<string, unknown>;
  fields?: Record<string, unknown>;
  fileName?: string;
  templateName?: string;
};
