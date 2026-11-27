import { createAction, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiApi } from '../../../common/api';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMidjourneyBlendOutputSchema } from '../../../output-schemas';

export const midjourneyBlendAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_blend',
  outputSchema: cometapiMidjourneyBlendOutputSchema,
  displayName: 'Midjourney Blend',
  description: 'Blends two or more images into a new Midjourney image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits a Midjourney blend of two or more base64 data URI images, without a text prompt, and returns the new task id in result. Use Midjourney Imagine instead when a prompt should drive the image. Poll the id with Midjourney Get Task; each call is a billed generation.',
    idempotent: false,
  },
  props: {
    base64Array: Property.Array({
      displayName: 'Images',
      description:
        'Two or more base64 data URIs, e.g. "data:image/png;base64,...".',
      required: true,
    }),
    dimensions: Property.StaticDropdown({
      displayName: 'Dimensions',
      description: 'Output aspect ratio.',
      required: false,
      options: {
        options: [
          { label: 'Portrait', value: 'PORTRAIT' },
          { label: 'Square', value: 'SQUARE' },
          { label: 'Landscape', value: 'LANDSCAPE' },
        ],
      },
    }),
    botType: cometApiAiProps.midjourneyBotType({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiApi.submitMidjourneyTask({
      auth,
      endpoint: 'blend',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          base64Array: propsValue.base64Array,
          dimensions: propsValue.dimensions,
          botType: propsValue.botType,
        },
      }),
    });
  },
});
