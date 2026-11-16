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
      'Fills the fields of a fillable (AcroForm) PDF and returns the URL of the new PDF. Pass data as one JSON object keyed by the exact field names from Inspect PDF Form: text or numbers for text fields, true or false for checkboxes, one of the listed options for radio buttons and dropdowns, and a list of options for multi-select lists. Leave a field out, or set it to null, to keep it as it is. Every value is checked before anything is written: the call fails, naming each wrong field, for an unknown name, a value longer than the max length, a value that is not one of the options, a read-only field or a non-Latin character, and nothing is cut short. Flatten (on by default) locks the values into the page; keep it on before Merge PDFs. XFA, flat and encrypted PDFs are refused. The source file is not changed and the same inputs give the same document, so idempotent.',
    idempotent: true,
  },
  outputSchema: fillPdfFormActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'PDF Form',
      description:
        'Its fields are found automatically. Use a fillable PDF from an earlier step or a URL.',
      placeholder: 'https://example.com/form.pdf',
      required: true,
    }),
    fields: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Fields',
      description:
        'One input per field found in the PDF, shown once the PDF Form is set.',
      required: false,
      refreshers: ['file'],
      props: async ({ file }) => formFields(file),
    }),
    data: Property.Json({
      displayName: 'Data (JSON)',
      description:
        'All the values as one object, for example {"city": "Austin", "agree": true}. Map it from an earlier step, or let an AI agent fill it. Each input in Option 1 shows the name to use here. When a field is set in both, this value wins.',
      required: false,
    }),
    flatten: Property.Checkbox({
      displayName: 'Flatten Form',
      description:
        'Lock the values into the page. Keep it on before Merge PDFs.',
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
      label: 'Option 1: Fill each field',
      icon: 'type',
      props: ['fields'],
    },
    {
      key: 'data',
      display: 'section',
      label: 'Option 2: Fill from Data (JSON)',
      icon: 'code',
      props: ['data'],
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
    return context.files.write({
      fileName: toFileName(fileName?.trim() || file.filename),
      data: filled,
    });
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
    return loadError instanceof MissingFormError
      ? fieldsNotice({
          message:
            'The fields are read from the PDF automatically. Set the PDF Form above, or map it from a step you have tested, and one input per field shows up here. You can also fill the form with Option 2 below.',
          variant: MarkdownVariant.INFO,
        })
      : fieldsNotice({
          message: `The PDF could not be downloaded (${describeDownloadError(
            loadError
          )}). Check the URL, or map the file from a step you have tested.`,
        });
  }
  const { data: form, error: openError } = await tryCatch(async () =>
    pdfForm.open(pdf)
  );
  if (openError) {
    return fieldsNotice({ message: openError.message });
  }
  if (form.kind !== 'acroform') {
    return fieldsNotice({ message: pdfForm.unfillableMessage(form.kind) });
  }
  const fillable = form.fields.filter(pdfForm.isFillable);
  if (fillable.length === 0) {
    return fieldsNotice({
      message:
        'This PDF has form fields, but none of them can be filled (they are buttons, signatures or read-only).',
    });
  }
  if (fillable.length > MAX_FIELDS) {
    return fieldsNotice({
      message: `This form has ${fillable.length} fields, too many to show here. Fill it with Option 2 below instead; Inspect PDF Form lists the field names.`,
    });
  }
  const inputs = Object.fromEntries(
    fillable.map((field) => [field.name, toFieldProperty(field)])
  );
  if (FIELDS_FOUND_KEY in inputs) {
    return inputs;
  }
  return {
    [FIELDS_FOUND_KEY]: Property.MarkDown({
      value: `**${fillable.length} ${
        fillable.length === 1 ? 'field' : 'fields'
      } found in this PDF.** Fill only the ones you need: an empty input keeps what the PDF already has. To send all the values as one object instead, use Option 2 below.`,
      variant: MarkdownVariant.INFO,
    }),
    ...inputs,
  };
}

function toFieldProperty(field: PdfFormField): DynamicPropsValue[string] {
  const name = field.label ?? field.name;
  const shortName = pdfForm.shortLabel({
    label: name,
    maxLength: field.maxLength,
  });
  const common = {
    displayName: shortName,
    description:
      shortName === name
        ? describeInput(field)
        : `${describeInput(field)} Full label: ${name}`,
    required: false,
  };
  if (field.type === 'checkbox') {
    return Property.StaticDropdown({
      ...common,
      options: {
        placeholder: KEEP_AS_IS,
        options: [
          { label: 'Checked', value: 'true' },
          { label: 'Unchecked', value: 'false' },
        ],
      },
    });
  }
  if (field.options !== null) {
    const options = {
      placeholder: KEEP_AS_IS,
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
  return [
    field.page === null ? null : `Page ${field.page}.`,
    field.maxLength === null ? null : `Up to ${field.maxLength} characters.`,
    `Name in Data (JSON): "${field.name}"${describeJsonValue(field)}.`,
  ]
    .filter((part) => part !== null)
    .join(' ');
}

function describeJsonValue(field: PdfFormField): string {
  if (field.type === 'checkbox') {
    return ', as true or false';
  }
  if (field.options === null) {
    return '';
  }
  return field.multiSelect
    ? ', as a list of the options'
    : ', as one of the options';
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

function fieldsNotice({
  message,
  variant = MarkdownVariant.WARNING,
}: {
  message: string;
  variant?: MarkdownVariant;
}): DynamicPropsValue {
  return {
    fieldsNotice: Property.MarkDown({ value: message, variant }),
  };
}

class MissingFormError extends Error {}

const MAX_FIELDS = 200;
const FIELDS_FOUND_KEY = 'fieldsFound';
const KEEP_AS_IS = 'Leave as it is';
