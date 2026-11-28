import { createAction, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiApi } from '../../../common/api';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMidjourneyBlendOutputSchema } from '../../../output-schemas';

export const midjourneyDescribeAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_describe',
  outputSchema: cometapiMidjourneyBlendOutputSchema,
  displayName: 'Midjourney Describe',
  description: 'Asks Midjourney to suggest prompts that describe an image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits a Midjourney describe task for one image, given as exactly one of a base64 data URI or a public URL, and returns the task id in result. The suggested prompts arrive in promptEn when Midjourney Get Task shows the task finished. Billed per call.',
    idempotent: false,
  },
  props: {
    base64: Property.LongText({
      displayName: 'Image (Base64)',
      description:
        'Image as a base64 data URI, e.g. "data:image/png;base64,...". Provide this or Image URL, not both.',
      required: false,
    }),
    link: Property.ShortText({
      displayName: 'Image URL',
      description:
        'Public URL of the image. Provide this or Image (Base64), not both.',
      required: false,
    }),
    botType: cometApiAiProps.midjourneyBotType({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { base64, link } = propsValue;
    if (!base64 === !link) {
      throw new Error('Provide exactly one of Image (Base64) or Image URL.');
    }
    return await cometApiApi.submitMidjourneyTask({
      auth,
      endpoint: 'describe',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          base64,
          link,
          botType: propsValue.botType,
        },
      }),
    });
  },
});
