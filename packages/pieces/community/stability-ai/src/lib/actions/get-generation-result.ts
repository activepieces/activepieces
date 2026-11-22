import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { asyncImageOutputSchema } from '../common/output-schemas';

export const getGenerationResult = createAction({
  auth: stabilityAiAuth,
  name: 'get_generation_result',
  classification: 'READ',
  displayName: 'Get Generation Result',
  description:
    'Fetch the result of a Creative Upscale or Replace Background and Relight job. Free; results are kept for 24 hours.',
  audience: 'both',
  aiMetadata: {
    description:
      'Checks a background Stability AI job started by Creative Upscale or Replace Background and Relight, using its 64-character generation ID. Returns status in-progress while the job runs, or complete with the saved image file. Free and safe to repeat; poll no more than once every 10 seconds. A 404 means the ID is unknown, older than 24 hours, or belongs to another API key. The file format was chosen when the job started; a result over the Activepieces file size limit (10 MB on Cloud) cannot be saved.',
    idempotent: true,
  },
  props: {
    generation_id: Property.ShortText({
      displayName: 'Generation ID',
      description: 'The 64-character generation ID returned by Creative Upscale or Replace Background and Relight.',
      required: true,
    }),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: asyncImageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    return stabilityClient.getResult({
      apiKey: context.auth.props.api_key,
      id: stabilityClient.normalizeGenerationId(props.generation_id),
      files: context.files,
      fileNamePrefix: 'generation-result',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
