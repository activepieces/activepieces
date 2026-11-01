import {
  ApFile,
  AppConnectionType,
  createMockActionContext,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  PDFBool,
  PDFDocument,
  PDFForm,
  PDFHexString,
  PDFName,
  PDFPage,
  PDFRef,
} from 'pdf-lib';
import { extractText, getDocumentProxy } from 'unpdf';
import { fillPdfForm } from '../src/lib/actions/fill-pdf-form';
import { inspectPdfForm } from '../src/lib/actions/inspect-pdf-form';
import { mergePdfs } from '../src/lib/actions/merge-pdfs';

describe('inspectPdfForm', () => {
  test('lists the fields of a fillable PDF in reading order', async () => {
    const pdf = await buildPdf({
      pageCount: 2,
      build: ({ form, pages }) => {
        const agree = form.createCheckBox('agree');
        agree.addToPage(pages[1], { x: 50, y: 700, width: 12, height: 12 });
        const state = form.createTextField('state');
        state.setMaxLength(2);
        state.addToPage(pages[0], { x: 300, y: 700, width: 40, height: 20 });
        const name = form.createTextField('entity.name');
        name.addToPage(pages[0], { x: 50, y: 740, width: 200, height: 20 });
        const city = form.createTextField('city');
        city.addToPage(pages[0], { x: 50, y: 700, width: 200, height: 20 });
      },
    });

    const result = await runInspect(pdf);

    expect(result).toEqual({
      kind: 'acroform',
      pageCount: 2,
      fields: [
        textField({ name: 'entity.name', page: 1 }),
        textField({ name: 'city', page: 1 }),
        textField({ name: 'state', page: 1, maxLength: 2 }),
        {
          ...textField({ name: 'agree', page: 2 }),
          type: 'checkbox',
          multiline: null,
        },
      ],
      emptyData: { 'entity.name': null, city: null, state: null, agree: null },
    });
  });

  test('describes labels, options and flags, and leaves unfillable fields out of emptyData', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const page = pages[0];
        const name = form.createTextField('1a');
        name.acroField.dict.set(
          PDFName.of('TU'),
          PDFHexString.fromText('Legal name of the entity')
        );
        name.enableRequired();
        name.addToPage(page, { x: 50, y: 740, width: 200, height: 20 });
        const notes = form.createTextField('notes');
        notes.enableMultiline();
        notes.addToPage(page, { x: 300, y: 740, width: 200, height: 20 });
        const size = form.createRadioGroup('size');
        size.addOptionToPage('Small', page, {
          x: 50,
          y: 700,
          width: 12,
          height: 12,
        });
        size.addOptionToPage('Large', page, {
          x: 80,
          y: 700,
          width: 12,
          height: 12,
        });
        const state = form.createDropdown('state');
        state.setOptions(['TX', 'CA']);
        state.addToPage(page, { x: 50, y: 660, width: 60, height: 20 });
        const services = form.createOptionList('services');
        services.setOptions(['Filing', 'Agent']);
        services.addToPage(page, { x: 50, y: 600, width: 100, height: 40 });
        const fileNumber = form.createTextField('fileNumber');
        fileNumber.enableReadOnly();
        fileNumber.addToPage(page, { x: 50, y: 560, width: 100, height: 20 });
        const submit = form.createButton('submit');
        submit.addToPage('Submit', page, {
          x: 50,
          y: 520,
          width: 60,
          height: 20,
        });
      },
    });

    const result = await runInspect(pdf);

    expect(result).toEqual(
      expect.objectContaining({
        fields: [
          {
            ...textField({ name: '1a', page: 1 }),
            label: 'Legal name of the entity',
            required: true,
          },
          { ...textField({ name: 'notes', page: 1 }), multiline: true },
          {
            ...textField({ name: 'size', page: 1 }),
            type: 'radio',
            multiline: null,
            options: ['Small', 'Large'],
          },
          {
            ...textField({ name: 'state', page: 1 }),
            type: 'dropdown',
            multiline: null,
            multiSelect: false,
            options: ['TX', 'CA'],
          },
          {
            ...textField({ name: 'services', page: 1 }),
            type: 'list',
            multiline: null,
            multiSelect: false,
            options: ['Filing', 'Agent'],
          },
          { ...textField({ name: 'fileNumber', page: 1 }), readOnly: true },
          {
            ...textField({ name: 'submit', page: 1 }),
            type: 'button',
            multiline: null,
          },
        ],
        emptyData: {
          '1a': null,
          notes: null,
          size: null,
          state: null,
          services: null,
        },
      })
    );
  });

  test.each([
    {
      kind: 'flat',
      title: 'a PDF without form fields',
      build: async () => buildPdf(),
    },
    {
      kind: 'xfa',
      title: 'a dynamic XFA form',
      build: async () => buildXfaPdf({ needsRendering: true, withField: true }),
    },
    {
      kind: 'xfa',
      title: 'an XFA form with no AcroForm fields',
      build: async () =>
        buildXfaPdf({ needsRendering: false, withField: false }),
    },
    {
      kind: 'acroform',
      title: 'an XFA form that also has AcroForm fields',
      build: async () =>
        buildXfaPdf({ needsRendering: false, withField: true }),
    },
    {
      kind: 'encrypted',
      title: 'an encrypted PDF',
      build: async () => buildEncryptedPdf(),
    },
  ])('reports $kind for $title', async ({ kind, build }) => {
    const result = await runInspect(await build());

    expect(result).toMatchObject({ kind, pageCount: 1 });
    if (kind !== 'acroform') {
      expect(result).toEqual(
        expect.objectContaining({ fields: [], emptyData: {} })
      );
    }
  });

  test('reports xfa for an XFA form that pdf-lib cannot load', async () => {
    const result = await runInspect(
      Buffer.from('%PDF-1.7\n1 0 obj\n<< /XFA 2 0 R >>\nendobj\n%%EOF')
    );

    expect(result).toEqual({
      kind: 'xfa',
      pageCount: null,
      fields: [],
      emptyData: {},
    });
  });

  test('fails with a clear message for a file that is not a PDF', async () => {
    await expect(runInspect(Buffer.from('not a pdf'))).rejects.toThrow(
      'This file could not be read as a PDF.'
    );
  });
});

describe('fillPdfForm', () => {
  test('fills text fields from Data (JSON) and flattens the form by default', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        form
          .createTextField('entity.name')
          .addToPage(pages[0], { x: 50, y: 700, width: 300, height: 20 });
        form
          .createTextField('city')
          .addToPage(pages[0], { x: 50, y: 650, width: 300, height: 20 });
      },
    });

    const { result, written } = await runFill({
      pdf,
      data: { 'entity.name': 'Acme Holdings LLC', city: 'Austin' },
    });

    expect(result).toEqual({ file: 'file-url', fileName: 'form.pdf' });
    expect(written).toHaveLength(1);
    expect(await countFields(written[0].data)).toBe(0);
    const text = await readText(written[0].data);
    expect(text).toContain('Acme Holdings LLC');
    expect(text).toContain('Austin');
  });

  test('leaves no page annotation pointing at a removed field after flattening', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const size = form.createRadioGroup('size');
        size.addOptionToPage('Small', pages[0], {
          x: 50,
          y: 700,
          width: 15,
          height: 15,
        });
        size.addOptionToPage('Large', pages[0], {
          x: 100,
          y: 700,
          width: 15,
          height: 15,
        });
        form
          .createTextField('city')
          .addToPage(pages[0], { x: 50, y: 650, width: 300, height: 20 });
      },
    });

    const { written } = await runFill({
      pdf,
      data: { size: 'Large', city: 'Austin' },
    });

    expect(await findMissingAnnotations(written[0].data)).toEqual([]);
  });
});

describe('fillPdfForm by field type', () => {
  test('sets every kind of field and leaves empty values untouched when not flattened', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const page = pages[0];
        form
          .createTextField('name')
          .addToPage(page, { x: 50, y: 740, width: 200, height: 20 });
        const kept = form.createTextField('kept');
        kept.setText('Original');
        kept.addToPage(page, { x: 300, y: 740, width: 200, height: 20 });
        form
          .createCheckBox('agree')
          .addToPage(page, { x: 50, y: 700, width: 12, height: 12 });
        form
          .createCheckBox('optOut')
          .addToPage(page, { x: 80, y: 700, width: 12, height: 12 });
        const size = form.createRadioGroup('size');
        size.addOptionToPage('Small', page, {
          x: 50,
          y: 660,
          width: 12,
          height: 12,
        });
        size.addOptionToPage('Large', page, {
          x: 80,
          y: 660,
          width: 12,
          height: 12,
        });
        const state = form.createDropdown('state');
        state.setOptions(['TX', 'CA']);
        state.addToPage(page, { x: 50, y: 620, width: 60, height: 20 });
        const services = form.createOptionList('services');
        services.setOptions(['Filing', 'Agent', 'Mail']);
        services.enableMultiselect();
        services.addToPage(page, { x: 50, y: 560, width: 100, height: 40 });
      },
    });

    const { written } = await runFill({
      pdf,
      flatten: false,
      data: {
        name: 42,
        kept: '',
        agree: true,
        optOut: 'true',
        size: 'Large',
        state: 'CA',
        services: ['Agent', 'Mail'],
      },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    expect(form.getTextField('name').getText()).toBe('42');
    expect(form.getTextField('kept').getText()).toBe('Original');
    expect(form.getCheckBox('agree').isChecked()).toBe(true);
    expect(form.getCheckBox('optOut').isChecked()).toBe(true);
    expect(form.getRadioGroup('size').getSelected()).toBe('Large');
    expect(form.getDropdown('state').getSelected()).toEqual(['CA']);
    expect(form.getOptionList('services').getSelected()).toEqual([
      'Agent',
      'Mail',
    ]);
  });

  test('unchecks a checkbox given false', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const agree = form.createCheckBox('agree');
        agree.addToPage(pages[0], { x: 50, y: 700, width: 12, height: 12 });
        agree.check();
      },
    });

    const { written } = await runFill({
      pdf,
      flatten: false,
      data: { agree: false },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    expect(form.getCheckBox('agree').isChecked()).toBe(false);
  });
});

describe('fillPdfForm checks', () => {
  async function buildCheckedForm(): Promise<Buffer> {
    return buildPdf({
      build: ({ form, pages }) => {
        const page = pages[0];
        const state = form.createTextField('state');
        state.setMaxLength(2);
        state.addToPage(page, { x: 50, y: 740, width: 40, height: 20 });
        form
          .createTextField('city')
          .addToPage(page, { x: 100, y: 740, width: 200, height: 20 });
        const country = form.createDropdown('country');
        country.setOptions(['US', 'CA']);
        country.addToPage(page, { x: 50, y: 700, width: 60, height: 20 });
        const county = form.createDropdown('county');
        county.setOptions(['Travis']);
        county.enableEditing();
        county.addToPage(page, { x: 150, y: 700, width: 60, height: 20 });
        const size = form.createRadioGroup('size');
        size.addOptionToPage('Small', page, {
          x: 50,
          y: 660,
          width: 12,
          height: 12,
        });
        const services = form.createOptionList('services');
        services.setOptions(['Filing', 'Agent']);
        services.addToPage(page, { x: 50, y: 600, width: 100, height: 40 });
        const fileNumber = form.createTextField('fileNumber');
        fileNumber.enableReadOnly();
        fileNumber.addToPage(page, { x: 50, y: 560, width: 100, height: 20 });
        form
          .createButton('submit')
          .addToPage('Submit', page, { x: 50, y: 520, width: 60, height: 20 });
        form
          .createCheckBox('agree')
          .addToPage(page, { x: 50, y: 480, width: 12, height: 12 });
      },
    });
  }

  test('reports every problem in one error, names each field, and writes no file', async () => {
    const pdf = await buildCheckedForm();
    const write = createFileWriter();

    const fill = runFill({
      pdf,
      write,
      data: {
        nope: 'x',
        state: 'Texas',
        city: 'Łódź',
        country: 'MX',
        size: 'Medium',
        services: ['Mail'],
        fileNumber: '123',
        submit: 'go',
        agree: 'maybe',
      },
    });

    const error = await fill.then(
      () => undefined,
      (reason: Error) => reason
    );
    expect(error?.message.split('\n')).toEqual([
      'The PDF form was not filled. Fix these 9 fields and try again:',
      '- "nope": this PDF has no field with this name. Run Inspect PDF Form to see the field names.',
      '- "state": the value has 5 characters, but this field takes at most 2.',
      '- "city": the form\'s font cannot draw "Ł". Only Latin characters are supported.',
      '- "country": "MX" is not one of the options (US, CA).',
      '- "size": "Medium" is not one of the options (Small).',
      '- "services": "Mail" is not one of the options (Filing, Agent).',
      '- "fileNumber": this field is read-only.',
      '- "submit": a button field cannot be filled.',
      '- "agree": use true or false for a checkbox.',
    ]);
    expect(write).not.toHaveBeenCalled();
  });

  test('accepts a value outside the options when the dropdown allows typing', async () => {
    const pdf = await buildCheckedForm();

    const { written } = await runFill({
      pdf,
      flatten: false,
      data: { county: 'Harris' },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    expect(form.getDropdown('county').getSelected()).toEqual(['Harris']);
  });

  test('rejects a list or object for a text field and several options for a single-choice field', async () => {
    const pdf = await buildCheckedForm();

    await expect(
      runFill({
        pdf,
        data: { city: { name: 'Austin' }, country: ['US', 'CA'] },
      })
    ).rejects.toThrow(
      [
        'The PDF form was not filled. Fix these 2 fields and try again:',
        '- "city": use text, a number or true/false, not a list or an object.',
        '- "country": pick one option, not a list.',
      ].join('\n')
    );
  });

  test('names the field when a chosen option, or any option of a list, has characters the font cannot draw', async () => {
    const pdf = await buildPdf({
      drawFields: false,
      build: ({ form, pages }) => {
        const city = form.createDropdown('city');
        city.addToPage(pages[0], { x: 50, y: 700, width: 100, height: 20 });
        city.setOptions(['Łódź', 'Warsaw']);
        const offices = form.createOptionList('offices');
        offices.addToPage(pages[0], { x: 50, y: 600, width: 100, height: 40 });
        offices.setOptions(['Łódź', 'Warsaw']);
      },
    });

    await expect(
      runFill({ pdf, data: { city: 'Łódź', offices: 'Warsaw' } })
    ).rejects.toThrow(
      [
        'The PDF form was not filled. Fix these 2 fields and try again:',
        '- "city": the form\'s font cannot draw "Ł". Only Latin characters are supported.',
        '- "offices": the form\'s font cannot draw "Ł" in this list\'s options. Only Latin characters are supported.',
      ].join('\n')
    );
  });

  test('fails when Data (JSON) is not an object', async () => {
    const pdf = await buildCheckedForm();

    await expect(
      runFill({ pdf, data: JSON.parse('["Austin"]') })
    ).rejects.toThrow(
      'Data (JSON) must be an object with field names as keys, for example {"city": "Austin"}.'
    );
  });
});

describe('fillPdfForm on PDFs it cannot fill', () => {
  test.each([
    {
      kind: 'flat',
      build: async () => buildPdf(),
      message:
        'This PDF has no form fields to fill. Use a fillable PDF form, or place text at fixed positions with Add Text to PDF.',
    },
    {
      kind: 'xfa',
      build: async () => buildXfaPdf({ needsRendering: true, withField: true }),
      message:
        "This PDF is an XFA form (made with Adobe LiveCycle Designer), which Fill PDF Form cannot fill. Ask the form's publisher for a standard fillable PDF.",
    },
    {
      kind: 'encrypted',
      build: async () => buildEncryptedPdf(),
      message:
        'This PDF is encrypted or password-protected, so it cannot be filled. Save a copy without the password or security settings and try again.',
    },
  ])('fails on a $kind PDF and writes no file', async ({ build, message }) => {
    const write = createFileWriter();

    await expect(
      runFill({ pdf: await build(), write, data: { name: 'Acme' } })
    ).rejects.toThrow(message);
    expect(write).not.toHaveBeenCalled();
  });
});

describe('fillPdfForm fields', () => {
  async function buildFieldsForm(): Promise<Buffer> {
    return buildPdf({
      build: ({ form, pages }) => {
        const page = pages[0];
        const name = form.createTextField('entity.name');
        name.acroField.dict.set(
          PDFName.of('TU'),
          PDFHexString.fromText('Legal name of the entity')
        );
        name.addToPage(page, { x: 50, y: 740, width: 200, height: 20 });
        const state = form.createTextField('form1[0].state[0]');
        state.setMaxLength(2);
        state.addToPage(page, { x: 300, y: 740, width: 40, height: 20 });
        const notes = form.createTextField('12');
        notes.enableMultiline();
        notes.addToPage(page, { x: 50, y: 700, width: 200, height: 20 });
        form
          .createCheckBox('agree')
          .addToPage(page, { x: 50, y: 660, width: 12, height: 12 });
        const size = form.createRadioGroup('size');
        size.addOptionToPage('Small', page, {
          x: 50,
          y: 620,
          width: 12,
          height: 12,
        });
        size.addOptionToPage('Large', page, {
          x: 80,
          y: 620,
          width: 12,
          height: 12,
        });
        const services = form.createOptionList('services');
        services.setOptions(['Filing', 'Agent']);
        services.enableMultiselect();
        services.addToPage(page, { x: 50, y: 560, width: 100, height: 40 });
        const fileNumber = form.createTextField('fileNumber');
        fileNumber.enableReadOnly();
        fileNumber.addToPage(page, { x: 50, y: 520, width: 100, height: 20 });
        form
          .createButton('submit')
          .addToPage('Submit', page, { x: 50, y: 480, width: 60, height: 20 });
      },
    });
  }

  async function listFields(file: unknown) {
    const context = createMockActionContext<typeof fillPdfForm.props>({
      propsValue: {
        file: new ApFile('form.pdf', Buffer.alloc(0), 'pdf'),
        fields: undefined,
        data: undefined,
        flatten: undefined,
        fileName: undefined,
      },
    });
    return fillPdfForm.props.fields.props({ file }, context);
  }

  test('shows one input per fillable field, keyed by the field name, with number names first', async () => {
    const props = await listFields(
      new ApFile('form.pdf', await buildFieldsForm(), 'pdf')
    );

    expect(
      Object.entries(props).map(([key, property]) => [
        key,
        property.type,
        property.displayName,
      ])
    ).toEqual([
      ['12', PropertyType.LONG_TEXT, '12'],
      ['entity.name', PropertyType.SHORT_TEXT, 'Legal name of the entity'],
      ['form1[0].state[0]', PropertyType.SHORT_TEXT, 'form1[0].state[0]'],
      ['agree', PropertyType.STATIC_DROPDOWN, 'agree'],
      ['size', PropertyType.STATIC_DROPDOWN, 'size'],
      ['services', PropertyType.STATIC_MULTI_SELECT_DROPDOWN, 'services'],
    ]);
    expect(props['form1[0].state[0]'].description).toBe(
      'Field "form1[0].state[0]" on page 1. Up to 2 characters.'
    );
    expect(props['agree']).toMatchObject({
      description:
        'Field "agree" on page 1. Leave empty to keep the box as it is.',
      options: {
        options: [
          { label: 'Checked', value: 'true' },
          { label: 'Unchecked', value: 'false' },
        ],
      },
    });
    expect(props['size']).toMatchObject({
      options: {
        options: [
          { label: 'Small', value: 'Small' },
          { label: 'Large', value: 'Large' },
        ],
      },
    });
  });

  test('reads the form from a data URI', async () => {
    const pdf = await buildFieldsForm();

    const props = await listFields(
      `data:application/pdf;base64,${pdf.toString('base64')}`
    );

    expect(Object.keys(props)).toContain('entity.name');
  });

  test.each([
    {
      title: 'no form is set',
      file: undefined,
      notice:
        'Set the PDF Form above, or map it from a step you have tested, to see its fields here. You can also fill the form with Data (JSON).',
    },
    {
      title: 'the PDF has no fields',
      file: 'flat',
      notice:
        'This PDF has no form fields to fill. Use a fillable PDF form, or place text at fixed positions with Add Text to PDF.',
    },
  ])('shows a notice when $title', async ({ file, notice }) => {
    const value =
      file === 'flat' ? new ApFile('flat.pdf', await buildPdf(), 'pdf') : file;

    const props = await listFields(value);

    expect(props).toEqual({
      fieldsNotice: expect.objectContaining({
        type: PropertyType.MARKDOWN,
        description: notice,
      }),
    });
  });

  test('fills from the per-field inputs, and Data (JSON) wins for the same field', async () => {
    const pdf = await buildFieldsForm();

    const { written } = await runFill({
      pdf,
      flatten: false,
      fields: {
        'entity.name': 'Acme Holdings LLC',
        'form1[0].state[0]': 'CA',
        agree: 'true',
        size: '',
      },
      data: { 'form1[0].state[0]': 'TX' },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    expect(form.getTextField('entity.name').getText()).toBe(
      'Acme Holdings LLC'
    );
    expect(form.getTextField('form1[0].state[0]').getText()).toBe('TX');
    expect(form.getCheckBox('agree').isChecked()).toBe(true);
    expect(form.getRadioGroup('size').getSelected()).toBeUndefined();
  });

  test('names the field when a per-field input no longer matches the form', async () => {
    const pdf = await buildFieldsForm();

    await expect(
      runFill({ pdf, fields: { 'old.name': 'Acme' } })
    ).rejects.toThrow(
      '- "old.name": this PDF has no field with this name. Run Inspect PDF Form to see the field names.'
    );
  });

  test('keeps the values a form already has when the per-field inputs are left untouched', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const agree = form.createCheckBox('agree');
        agree.addToPage(pages[0], { x: 50, y: 700, width: 12, height: 12 });
        agree.check();
        const services = form.createOptionList('services');
        services.setOptions(['Filing', 'Agent']);
        services.enableMultiselect();
        services.addToPage(pages[0], { x: 50, y: 600, width: 100, height: 40 });
        services.select(['Agent']);
        form
          .createTextField('name')
          .addToPage(pages[0], { x: 50, y: 560, width: 200, height: 20 });
      },
    });

    const { written } = await runFill({
      pdf,
      flatten: false,
      fields: { agree: null, services: [], name: 'Acme' },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    expect(form.getCheckBox('agree').isChecked()).toBe(true);
    expect(form.getOptionList('services').getSelected()).toEqual(['Agent']);
    expect(form.getTextField('name').getText()).toBe('Acme');
  });

  test('unchecks a box chosen as Unchecked in the per-field inputs', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const agree = form.createCheckBox('agree');
        agree.addToPage(pages[0], { x: 50, y: 700, width: 12, height: 12 });
        agree.check();
      },
    });

    const { written } = await runFill({
      pdf,
      flatten: false,
      fields: { agree: 'false' },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    expect(form.getCheckBox('agree').isChecked()).toBe(false);
  });
});

describe('fillPdfForm line breaks', () => {
  test('turns tabs and line breaks into spaces in a single-line field and keeps them in a multiline field', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        form
          .createTextField('single')
          .addToPage(pages[0], { x: 50, y: 700, width: 300, height: 20 });
        const multi = form.createTextField('multi');
        multi.enableMultiline();
        multi.addToPage(pages[0], { x: 50, y: 600, width: 300, height: 60 });
      },
    });

    const { written } = await runFill({
      pdf,
      flatten: false,
      data: {
        single: 'Suite 400\r\nAustin\tTX',
        multi: '700 Lavaca St\nAustin, TX',
      },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    expect(form.getTextField('single').getText()).toBe('Suite 400 Austin TX');
    expect(form.getTextField('multi').getText()).toBe(
      '700 Lavaca St\nAustin, TX'
    );
  });
});

describe('fillPdfForm text size', () => {
  test('shrinks the font of a single-line field only when the value would overflow', async () => {
    const longValue = 'Acme Holdings International LLC';
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const page = pages[0];
        const add = ({
          name,
          y,
          width,
        }: {
          name: string;
          y: number;
          width: number;
        }) => {
          const field = form.createTextField(name);
          field.addToPage(page, { x: 50, y, width, height: 20 });
          field.setFontSize(12);
          return field;
        };
        add({ name: 'short', y: 740, width: 200 });
        add({ name: 'long', y: 700, width: 120 });
        add({ name: 'notes', y: 660, width: 60 }).enableMultiline();
        const comb = add({ name: 'comb', y: 620, width: 60 });
        comb.setMaxLength(5);
        comb.enableCombing();
      },
    });

    const { written } = await runFill({
      pdf,
      flatten: false,
      data: { short: 'TX', long: longValue, notes: 'TX', comb: 'ABCDE' },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    const fontSize = (name: string) =>
      Number(
        /(\d*\.?\d+)\s+Tf/.exec(
          form.getTextField(name).acroField.getDefaultAppearance() ?? ''
        )?.[1]
      );
    expect(fontSize('short')).toBe(12);
    expect(fontSize('long')).toBeGreaterThan(0);
    expect(fontSize('long')).toBeLessThan(12);
    expect(fontSize('notes')).toBe(12);
    expect(fontSize('comb')).toBe(12);
  });

  test('shrinks the font of a multiline field when the lines would overflow its height', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const notes = form.createTextField('notes');
        notes.enableMultiline();
        notes.addToPage(pages[0], { x: 50, y: 600, width: 300, height: 40 });
        notes.setFontSize(12);
      },
    });

    const { written } = await runFill({
      pdf,
      flatten: false,
      data: { notes: ['one', 'two', 'three', 'four', 'five'].join('\n') },
    });

    const form = (
      await PDFDocument.load(new Uint8Array(written[0].data))
    ).getForm();
    const fontSize = Number(
      /(\d*\.?\d+)\s+Tf/.exec(
        form.getTextField('notes').acroField.getDefaultAppearance() ?? ''
      )?.[1]
    );
    expect(fontSize).toBeGreaterThanOrEqual(4);
    expect(fontSize).toBeLessThan(8);
  });

  test('fails, naming the field, when the text cannot fit even at the smallest size', async () => {
    const pdf = await buildPdf({
      build: ({ form, pages }) => {
        const name = form.createTextField('name');
        name.addToPage(pages[0], { x: 50, y: 700, width: 100, height: 20 });
        name.setFontSize(12);
        const notes = form.createTextField('notes');
        notes.enableMultiline();
        notes.addToPage(pages[0], { x: 50, y: 600, width: 100, height: 30 });
        notes.setFontSize(12);
      },
    });
    const write = createFileWriter();

    await expect(
      runFill({
        pdf,
        write,
        data: {
          name: 'W'.repeat(200),
          notes: Array.from({ length: 30 }, () => 'line').join('\n'),
        },
      })
    ).rejects.toThrow(
      [
        'The PDF form was not filled. Fix these 2 fields and try again:',
        '- "name": the text does not fit in this field\'s box, even at the smallest font size. Shorten it.',
        '- "notes": the text does not fit in this field\'s box, even at the smallest font size. Shorten it.',
      ].join('\n')
    );
    expect(write).not.toHaveBeenCalled();
  });
});

describe('filled forms in a packet', () => {
  test('keeps the values of flattened forms after Merge PDFs', async () => {
    const blankForm = await buildPdf({
      build: ({ form, pages }) => {
        form
          .createTextField('name')
          .addToPage(pages[0], { x: 50, y: 700, width: 300, height: 20 });
      },
    });
    const first = await runFill({
      pdf: blankForm,
      data: { name: 'Acme Texas LLC' },
    });
    const second = await runFill({
      pdf: blankForm,
      data: { name: 'Acme Wisconsin LLC' },
    });

    const merged = await runMerge([
      first.written[0].data,
      second.written[0].data,
    ]);

    const text = await readText(merged);
    expect(text).toContain('Acme Texas LLC');
    expect(text).toContain('Acme Wisconsin LLC');
  });
});

describe('fillPdfForm file name', () => {
  test.each([
    { fileName: undefined, sourceName: 'tx-301.pdf', expected: 'tx-301.pdf' },
    { fileName: '  ', sourceName: 'download', expected: 'download.pdf' },
    {
      fileName: 'Texas packet',
      sourceName: 'form.pdf',
      expected: 'Texas packet.pdf',
    },
    { fileName: 'filed.PDF', sourceName: 'form.pdf', expected: 'filed.pdf' },
  ])(
    'names the file $expected when File Name is "$fileName" and the form is $sourceName',
    async ({ fileName, sourceName, expected }) => {
      const pdf = await buildPdf({
        build: ({ form, pages }) => {
          form
            .createTextField('name')
            .addToPage(pages[0], { x: 50, y: 700, width: 300, height: 20 });
        },
      });

      const { result, written } = await runFill({
        pdf,
        sourceName,
        fileName,
        data: { name: 'Acme' },
      });

      expect(result).toEqual({ file: 'file-url', fileName: expected });
      expect(written[0].fileName).toBe(expected);
    }
  );
});

async function buildPdf({
  pageCount = 1,
  build = () => undefined,
  drawFields = true,
}: BuildPdfParams = {}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const pages = Array.from({ length: pageCount }, () =>
    doc.addPage([612, 792])
  );
  build({ doc, form: doc.getForm(), pages });
  return Buffer.from(await doc.save({ updateFieldAppearances: drawFields }));
}

async function runInspect(pdf: Buffer) {
  const context = createMockActionContext<typeof inspectPdfForm.props>({
    propsValue: { file: new ApFile('form.pdf', pdf, 'pdf') },
  });
  return inspectPdfForm.run(context);
}

async function runFill({
  pdf,
  data,
  fields,
  flatten,
  fileName,
  sourceName = 'form.pdf',
  write = createFileWriter(),
}: RunFillParams) {
  const context = createMockActionContext<typeof fillPdfForm.props>({
    propsValue: {
      file: new ApFile(sourceName, pdf, 'pdf'),
      fields,
      data,
      flatten,
      fileName,
    },
  });
  const result = await fillPdfForm.run({
    ...context,
    files: { ...context.files, write },
  });
  return { result, written: writtenFiles(write) };
}

function createFileWriter() {
  return vi
    .fn<(file: { fileName: string; data: unknown }) => Promise<string>>()
    .mockResolvedValue('file-url');
}

function writtenFiles(write: FileWriter): WrittenFile[] {
  return write.mock.calls.map(([{ fileName, data }]) => {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Expected the PDF as a Buffer');
    }
    return { fileName, data };
  });
}

async function readText(pdf: Buffer): Promise<string> {
  const proxy = await getDocumentProxy(new Uint8Array(pdf));
  const { text } = await extractText(proxy, { mergePages: true });
  return text;
}

async function countFields(pdf: Buffer): Promise<number> {
  const form = (await PDFDocument.load(new Uint8Array(pdf))).getForm();
  return form.getFields().length;
}

async function buildXfaPdf({
  needsRendering,
  withField,
}: {
  needsRendering: boolean;
  withField: boolean;
}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const form = doc.getForm();
  if (withField) {
    form
      .createTextField('name')
      .addToPage(page, { x: 50, y: 700, width: 200, height: 20 });
  }
  form.acroForm.dict.set(
    PDFName.of('XFA'),
    doc.context.flateStream('<xdp:xdp></xdp:xdp>')
  );
  if (needsRendering) {
    doc.catalog.set(PDFName.of('NeedsRendering'), PDFBool.True);
  }
  return Buffer.from(await doc.save());
}

async function buildEncryptedPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: 'Standard' });
  return Buffer.from(await doc.save());
}

function textField({
  name,
  page,
  maxLength = null,
}: {
  name: string;
  page: number;
  maxLength?: number | null;
}) {
  return {
    name,
    label: null,
    type: 'text',
    page,
    required: false,
    readOnly: false,
    maxLength,
    multiline: false,
    multiSelect: null,
    options: null,
  };
}

async function findMissingAnnotations(pdf: Buffer): Promise<string[]> {
  const doc = await PDFDocument.load(new Uint8Array(pdf));
  return doc
    .getPages()
    .flatMap((page, index) =>
      (page.node.Annots()?.asArray() ?? [])
        .filter(
          (annotation) =>
            annotation instanceof PDFRef &&
            doc.context.lookup(annotation) === undefined
        )
        .map((annotation) => `page ${index + 1}: ${annotation.toString()}`)
    );
}

async function runMerge(pdfs: Buffer[]): Promise<Buffer> {
  const write = createFileWriter();
  const context = createMockActionContext<typeof mergePdfs.props>({
    propsValue: {
      pdfFiles: pdfs.map((data, index) => ({
        file: new ApFile(`form-${index}.pdf`, data, 'pdf'),
      })),
      outputFileName: 'packet',
    },
  });
  await mergePdfs.run({
    ...context,
    auth: { type: AppConnectionType.SECRET_TEXT, secret_text: '' },
    files: { ...context.files, write },
  });
  return writtenFiles(write)[0].data;
}

type BuildPdfParams = {
  pageCount?: number;
  drawFields?: boolean;
  build?: (params: {
    doc: PDFDocument;
    form: PDFForm;
    pages: PDFPage[];
  }) => void;
};

type RunFillParams = {
  pdf: Buffer;
  data?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  flatten?: boolean;
  fileName?: string;
  sourceName?: string;
  write?: FileWriter;
};

type WrittenFile = { fileName: string; data: Buffer };

type FileWriter = ReturnType<typeof createFileWriter>;
