import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../../auth';
import { datalabSource } from '../../common/source';
import { fillOperation } from '../../operations/fill';

export const aiFillFormAction = createAction({
  auth: datalabAuth,
  name: 'ai_fill_form',
  classification: 'READ',
  displayName: 'Fill Form',
  description:
    'Fills a flat, scanned or image form from a public link with AI and saves the filled file. Slow action: one page usually takes 1 to 4 minutes (5 to 8 for a dense form with many fields); Get Result collects it when the 4 minute wait runs out. For a normal fillable PDF, the Fill PDF Form action of the PDF piece is cheaper and instant.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fill a flat, scanned or image form (PDF, PNG or JPG at a public URL) with given values by matching each field label to the form, and save the filled file in Activepieces. Pick it only for forms with no fillable fields; for a normal fillable PDF the PDF piece\'s Fill PDF Form is cheaper and instant, and call Get Form Fields first to learn the labels. Slow action: one page usually takes 1 to 4 minutes, and a dense form with many fields can take 5 to 8, so a long wait is normal and does not mean it is stuck. It waits up to 4 minutes; if Datalab is still working it returns completed=false and a request_id: that is a timeout, not a failure, so pass the request_id to Get Result with operation Fill Form instead of calling Fill Form again. Each run spends Datalab credits.',
    idempotent: true,
  },
  props: fillOperation.aiProps(),
  outputSchema: fillOperation.outputSchema,
  async run({ auth, propsValue, files }) {
    return fillOperation.run({
      apiKey: auth.secret_text,
      audience: 'ai',
      source: datalabSource.fromAi({ fileUrl: propsValue.file_url, noun: 'form' }),
      fields: fillOperation.fieldsFromJson(propsValue.field_values),
      context: propsValue.form_context,
      confidenceThreshold: propsValue.confidence_threshold,
      pageRange: propsValue.page_range,
      outputFileName: propsValue.output_file_name,
      skipCache: propsValue.skip_cache,
      files,
    });
  },
});
