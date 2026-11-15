import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { datalabSource } from '../common/source';
import { fillOperation } from '../operations/fill';

export const fillFormAction = createAction({
  auth: datalabAuth,
  name: 'fill_form',
  classification: 'READ',
  displayName: 'Fill Form',
  description: 'Fills a flat or scanned form with no fillable fields. Slow action: 1 to 4 minutes a page.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fill a flat, scanned or image form (PDF, PNG or JPG) with given values by matching each field label to the form, and save the filled file in Activepieces. Pick it only for forms with no fillable fields; for a normal fillable PDF the PDF piece\'s Fill PDF Form is cheaper and instant, and run Get Form Fields first to learn the labels. Slow action: one page usually takes 1 to 4 minutes, and a dense form with many fields can take 5 to 8, so a long wait is normal and does not mean it is stuck. It waits up to 6 minutes; if Datalab is still working the step fails with a "Timed out waiting for Datalab" error that carries the request ID to collect with Get Result. Each run spends Datalab credits.',
    idempotent: true,
  },
  props: fillOperation.humanProps(),
  outputSchema: fillOperation.outputSchema,
  async run({ auth, propsValue, files }) {
    return fillOperation.run({
      apiKey: auth.secret_text,
      audience: 'human',
      source: datalabSource.fromHuman({ source: propsValue.source, input: propsValue.document, noun: 'form' }),
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
