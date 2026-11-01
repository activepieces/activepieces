import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { inspectPdfFormActionOutputSchema } from '../output-schemas';
import { pdfForm } from '../pdf-form';

export const inspectPdfForm = createAction({
  auth: PieceAuth.None(),
  audience: 'both',
  name: 'inspectPdfForm',
  classification: 'READ',
  displayName: 'Inspect PDF Form',
  description:
    'List the fields of a PDF form with their current values, and check whether Fill PDF Form can fill it.',
  aiMetadata: {
    description:
      'Opens a PDF and reports whether it is a fillable form and which fields it has. kind is acroform (fillable), xfa (an Adobe XFA form that cannot be filled), flat (no form fields) or encrypted (password-protected). For each field it returns the exact name to use in Fill PDF Form, its label, type, page, max length, allowed options and current value (text, true or false for a checkbox, the chosen option, or a list for a multi-select list; null when empty), plus emptyData: an object with every fillable field set to null. Call it before Fill PDF Form to learn the field names and allowed values; names are often codes like 1a, so read the label and page to tell fields apart. To check a fill, run it on a copy filled with Flatten Form off; a flattened copy has no fields left, so use Extract Text on it instead. It also reads the answers from a form someone else filled in. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: inspectPdfFormActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'PDF Form',
      description: 'The PDF to inspect, from an earlier step or a URL.',
      placeholder: 'https://example.com/form.pdf',
      required: true,
    }),
  },
  async run(context) {
    const form = await pdfForm.open(context.propsValue.file.data);
    return {
      kind: form.kind,
      pageCount: form.pageCount,
      fields: form.fields,
      emptyData: Object.fromEntries(
        form.fields
          .filter(pdfForm.isFillable)
          .map((field) => [field.name, null])
      ),
    };
  },
});
