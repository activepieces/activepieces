import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { datalabSource } from '../common/source';
import { formFieldsOperation } from '../operations/form-fields';

export const getFormFieldsAction = createAction({
  auth: datalabAuth,
  name: 'get_form_fields',
  classification: 'READ',
  displayName: 'Get Form Fields',
  description: 'Lists the fields on a form. Run it before Fill Form to learn the field labels.',
  audience: 'human',
  aiMetadata: {
    description:
      'List the fields on a form (PDF or image), with each field\'s label, type, page and position, including blank lines, boxes and tick boxes on flat and scanned forms. Call it before Fill Form to learn the labels to fill; it changes nothing. Waits up to 4 minutes (usually a few seconds); if Datalab is still working the step fails with the request ID to collect with Get Result. Each run spends Datalab credits.',
    idempotent: true,
  },
  props: formFieldsOperation.humanProps(),
  outputSchema: formFieldsOperation.outputSchema,
  async run({ auth, propsValue, files }) {
    return formFieldsOperation.run({
      apiKey: auth.secret_text,
      audience: 'human',
      source: datalabSource.fromHuman({ source: propsValue.source, input: propsValue.document, noun: 'form' }),
      includeText: propsValue.include_text,
      pageRange: propsValue.page_range,
      maxPages: propsValue.max_pages,
      skipCache: propsValue.skip_cache,
      files,
    });
  },
});
