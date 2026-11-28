import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../../auth';
import { datalabSource } from '../../common/source';
import { formFieldsOperation } from '../../operations/form-fields';

export const aiGetFormFieldsAction = createAction({
  auth: datalabAuth,
  name: 'ai_get_form_fields',
  classification: 'READ',
  displayName: 'Get Form Fields',
  description:
    'Lists the fields on a form from a public link, with their labels, types and positions. Run it before Fill Form to learn which field labels the form has. It finds blank lines, boxes and tick boxes on flat and scanned forms too. Pages are counted from 0.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the fields on a form (PDF or image at a public URL), with each field\'s label, type, page (counted from 0) and position, including blank lines, boxes and tick boxes on flat and scanned forms. Call it before Fill Form to learn the labels to pass as field names; it changes nothing. Waits up to 4 minutes (usually a few seconds); if Datalab is still working it returns completed=false and a request_id to pass to Get Result with operation Get Form Fields. Each run spends Datalab credits.',
    idempotent: true,
  },
  props: formFieldsOperation.aiProps(),
  outputSchema: formFieldsOperation.outputSchema,
  async run({ auth, propsValue, files }) {
    return formFieldsOperation.run({
      apiKey: auth.secret_text,
      audience: 'ai',
      source: datalabSource.fromAi({ fileUrl: propsValue.file_url, noun: 'form' }),
      includeText: propsValue.include_text,
      pageRange: propsValue.page_range,
      maxPages: propsValue.max_pages,
      skipCache: propsValue.skip_cache,
      files,
    });
  },
});
