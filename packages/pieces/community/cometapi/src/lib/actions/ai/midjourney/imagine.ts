import { createAction, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiApi } from '../../../common/api';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMidjourneyImagineOutputSchema } from '../../../output-schemas';

export const midjourneyImagineAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_imagine',
  outputSchema: cometapiMidjourneyImagineOutputSchema,
  displayName: 'Midjourney Imagine',
  description: 'Starts a Midjourney image generation from a text prompt.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits a Midjourney or Niji text-to-image task (prompt may carry Midjourney parameters like --ar or --v, plus optional base64 reference images) and returns the new task id in result. Poll it with Midjourney Get Task; its buttons then feed Midjourney Action for upscales and variations. Each call is a fresh, billed generation.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Text prompt, optionally with Midjourney parameters such as "--ar 16:9 --v 6.1".',
      required: true,
    }),
    botType: cometApiAiProps.midjourneyBotType({ required: false }),
    base64Array: Property.Array({
      displayName: 'Reference Images',
      description:
        'Base64 data URIs of reference images, e.g. "data:image/png;base64,...".',
      required: false,
    }),
    modes: Property.StaticMultiSelectDropdown({
      displayName: 'Speed Modes',
      description:
        'Allowed Midjourney speed modes for this task. Leave empty for any.',
      required: false,
      options: {
        options: [
          { label: 'Fast', value: 'FAST' },
          { label: 'Relax', value: 'RELAX' },
          { label: 'Turbo', value: 'TURBO' },
        ],
      },
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { modes, base64Array } = propsValue;
    return await cometApiApi.submitMidjourneyTask({
      auth,
      endpoint: 'imagine',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          prompt: propsValue.prompt,
          botType: propsValue.botType,
          base64Array:
            base64Array && base64Array.length > 0 ? base64Array : undefined,
          accountFilter: modes && modes.length > 0 ? { modes } : undefined,
        },
      }),
    });
  },
});
