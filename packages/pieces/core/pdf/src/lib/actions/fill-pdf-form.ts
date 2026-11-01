import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  ApFile,
  createAction,
  DynamicPropsValue,
  MarkdownVariant,
  PieceAuth,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { fillPdfFormActionOutputSchema } from '../output-schemas';
import { PdfFormField, pdfForm } from '../pdf-form';

export const fillPdfForm = createAction({
  auth: PieceAuth.None(),
  audience: 'both',
  name: 'fillPdfForm',
  classification: 'READ',
  displayName: 'Fill PDF Form',
  description: 'Fill the fields of a fillable PDF form and get a new PDF.',
  aiMetadata: {
    description:
      'Fills the fields of a fillable (AcroForm) PDF and returns a new PDF. Pass data as one JSON object keyed by the exact field names from Inspect PDF Form: text or numbers for text fields, true or false for checkboxes, one of the listed options for radio buttons and dropdowns, and a list of options for multi-select lists. Leave a field out, or set it to null, to keep it as it is. Every value is checked before anything is written: the call fails, naming each wrong field, for an unknown name, a value longer than the max length, a value that is not one of the options, a read-only field or a non-Latin character, and nothing is cut short. Flatten (on by default) locks the values into the page; keep it on before Merge PDFs. XFA, flat and encrypted PDFs are refused. The source file is not changed and the same inputs give the same document, so idempotent.',
    idempotent: true,
  },
  outputSchema: fillPdfFormActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'PDF Form',
      description: 'A fillable PDF form, from an earlier step or a URL.',
      placeholder: 'https://example.com/form.pdf',
      required: true,
    }),
    fields: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Fields',
      description:
        'One input per form field. They appear once the PDF Form is set, or mapped from a step you have tested.',
      required: false,
      refreshers: ['file'],
      props: async ({ file }) => formFields(file),
    }),
    data: Property.Json({
      displayName: 'Data (JSON)',
      description:
        "Optional. An object of field names and values, such as Inspect PDF Form's Empty Data with the nulls replaced. It wins over the inputs above for the same field.",
      required: false,
    }),
    flatten: Property.Checkbox({
      displayName: 'Flatten Form',
      description:
        'Lock the values into the page so they can no longer be edited. Keep it on before Merge PDFs, which drops form fields.',
      required: false,
      defaultValue: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: "Name of the new PDF. Leave empty to use the form's name.",
      placeholder: 'filled-form.pdf',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'Form',
      icon: 'file',
      props: ['file'],
    },
    {
      key: 'values',
      display: 'section',
      label: 'Values',
      icon: 'type',
      props: ['fields', 'data'],
    },
    {
      key: 'output',
      display: 'section',
      label: 'Output',
      icon: 'sliders',
      props: ['flatten'],
    },
  ],
  async run(context) {
    const { file, fields, data, flatten, fileName } = context.propsValue;
    if (
      data !== undefined &&
      data !== null &&
      (typeof data !== 'object' || Array.isArray(data))
    ) {
      throw new Error(
        'Data (JSON) must be an object with field names as keys, for example {"city": "Austin"}.'
      );
    }
    const filled = await pdfForm.fill({
      data: file.data,
      values: {
        ...withoutEmpty(fields ?? {}),
        ...withoutEmpty(data ?? {}),
      },
      flatten: flatten !== false,
    });
    const name = toFileName(fileName?.trim() || file.filename);
    return {
      file: await context.files.write({ fileName: name, data: filled }),
      fileName: name,
    };
  },
});

function toFileName(requested: string): string {
  return `${requested.replace(/\.pdf$/i, '')}.pdf`;
}

async function formFields(file: unknown): Promise<DynamicPropsValue> {
  const { data: pdf, error: loadError } = await tryCatch(async () =>
    loadPdf(file)
  );
  if (loadError) {
    return fieldsNotice(
      loadError instanceof MissingFormError
        ? 'Set the PDF Form above, or map it from a step you have tested, to see its fields here. You can also fill the form with Data (JSON).'
        : `The PDF could not be downloaded (${describeDownloadError(
            loadError
          )}). Check the URL, or map the file from a step you have tested.`
    );
  }
  const { data: form, error: openError } = await tryCatch(async () =>
    pdfForm.open(pdf)
  );
  if (openError) {
    return fieldsNotice(openError.message);
  }
  if (form.kind !== 'acroform') {
    return fieldsNotice(pdfForm.unfillableMessage(form.kind));
  }
  const fillable = form.fields.filter(pdfForm.isFillable);
  if (fillable.length === 0) {
    return fieldsNotice(
      'This PDF has form fields, but none of them can be filled (they are buttons, signatures or read-only).'
    );
  }
  if (fillable.length > MAX_FIELDS) {
    return fieldsNotice(
      `This form has ${fillable.length} fields, too many to show here. Fill it with Data (JSON) instead; Inspect PDF Form lists the field names.`
    );
  }
  return Object.fromEntries(
    fillable.map((field) => [field.name, toFieldProperty(field)])
  );
}

function toFieldProperty(field: PdfFormField): DynamicPropsValue[string] {
  const common = {
    displayName: field.label ?? field.name,
    description: describeInput(field),
    required: false,
  };
  if (field.type === 'checkbox') {
    return Property.StaticDropdown({
      ...common,
      options: {
        options: [
          { label: 'Checked', value: 'true' },
          { label: 'Unchecked', value: 'false' },
        ],
      },
    });
  }
  if (field.options !== null) {
    const options = {
      options: field.options.map((option) => ({
        label: option,
        value: option,
      })),
    };
    return field.multiSelect
      ? Property.StaticMultiSelectDropdown({ ...common, options })
      : Property.StaticDropdown({ ...common, options });
  }
  return field.multiline
    ? Property.LongText(common)
    : Property.ShortText(common);
}

function describeInput(field: PdfFormField): string {
  const where =
    field.page === null
      ? `Field "${field.name}".`
      : `Field "${field.name}" on page ${field.page}.`;
  if (field.type === 'checkbox') {
    return `${where} Leave empty to keep the box as it is.`;
  }
  return field.maxLength === null
    ? where
    : `${where} Up to ${field.maxLength} characters.`;
}

function withoutEmpty(
  values: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => !pdfForm.isEmpty(value))
  );
}

async function loadPdf(value: unknown): Promise<Buffer> {
  if (value instanceof ApFile) {
    return value.data;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MissingFormError();
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

class MissingFormError extends Error {}

const MAX_FIELDS = 200;
