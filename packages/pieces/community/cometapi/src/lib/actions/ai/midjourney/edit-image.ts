import { createAction, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiApi } from '../../../common/api';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMidjourneyEditImageOutputSchema } from '../../../output-schemas';

export const midjourneyEditImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_edit_image',
  outputSchema: cometapiMidjourneyEditImageOutputSchema,
  displayName: 'Midjourney Edit Image',
  description:
    'Edits an existing image with Midjourney from a text instruction.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits a Midjourney editor task that changes any image (public URL or base64 data URI) according to a text prompt, and returns the task id in result to poll with Midjourney Get Task. Use Midjourney Modal instead to repaint a region of a Midjourney-generated task. Billed generation.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The edit to make, e.g. "Change to white background".',
      required: true,
    }),
    image: Property.LongText({
      displayName: 'Image',
      description: 'Image to edit, as a public URL or a base64 data URI.',
      required: true,
    }),
    noStorage: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Provider URL',
      description:
        'Yes returns the original provider image URL instead of a CometAPI-proxied link.',
      trueLabel: 'Yes',
      falseLabel: 'No',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { noStorage } = propsValue;
    return await cometApiApi.submitMidjourneyTask({
      auth,
      endpoint: 'edits',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          prompt: propsValue.prompt,
          image: propsValue.image,
          noStorage: cometApiUtils.toBoolean({ value: noStorage }),
        },
      }),
    });
  },
});
