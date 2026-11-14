import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { datalabSource } from '../common/source';
import { fillOperation } from '../operations/fill';

export const fillFormAction = createAction({
  auth: datalabAuth,
  name: 'fill_form',
  classification: 'READ',
  displayName: 'Fill Form',
  description:
    'Fills a flat, scanned or image form that has no fillable fields, using AI to place each value, and saves the filled file. Slow action: one page usually takes 1 to 4 minutes, and the step waits up to 6 minutes before it stops with a timeout message that says how to get the result. For a normal fillable PDF, the Fill PDF Form action of the PDF piece is cheaper and instant. A saved file is limited to 10 MB on Activepieces Cloud.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fill a flat, scanned or image form (PDF, PNG or JPG) with given values by matching each field label to the form, and save the filled file in Activepieces. Pick it only for forms with no fillable fields; for a normal fillable PDF the PDF piece\'s Fill PDF Form is cheaper and instant, and run Get Form Fields first to learn the labels. Slow action: one page usually takes 1 to 4 minutes, so a long wait is normal and does not mean it is stuck. It waits up to 6 minutes; if Datalab is still working the step fails with a "Timed out waiting for Datalab" error that carries the request ID to collect with Get Result. Each run spends Datalab credits.',
    idempotent: true,
  },
  props: fillOperation.humanProps(),
  outputSchema: fillOperation.outputSchema,
  async run({ auth, propsValue, files }) {
    return fillOperation.run({
      apiKey: auth.secret_text,
      audience: 'human',
      source: datalabSource.fromHuman({ source: propsValue.source, file: propsValue.file, fileUrl: propsValue.file_url, noun: 'form' }),
      fields: fillOperation.fieldsFromList(propsValue.field_values),
      context: propsValue.form_context,
      confidenceThreshold: propsValue.confidence_threshold,
      pageRange: propsValue.page_range,
      outputFileName: propsValue.output_file_name,
      skipCache: propsValue.skip_cache,
      files,
    });
  },
});
