import { createAction, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiApi } from '../../../common/api';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMidjourneyBlendOutputSchema } from '../../../output-schemas';

export const midjourneyModalAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_modal',
  outputSchema: cometapiMidjourneyBlendOutputSchema,
  displayName: 'Midjourney Modal',
  description:
    'Completes a Midjourney button that asks for more input, such as Vary Region or Custom Zoom.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Sends the follow-up input (prompt and, for Vary Region, a base64 mask where white is repainted) for a button that Midjourney Action answered with code 21. Pass the task id that Midjourney Action returned and the same button customId, read from a finished task's buttons with Midjourney Get Task. Returns a new task id to poll with Midjourney Get Task; billed generation.",
    idempotent: false,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description:
        'Task ID returned by Midjourney Action when it answered code 21.',
      required: true,
    }),
    customId: Property.ShortText({
      displayName: 'Custom ID',
      description:
        'customId of the button that opened the modal, e.g. "MJ::Inpaint::1::...::SOLO", from Midjourney Get Task.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Text describing the change for the selected region or zoom.',
      required: false,
    }),
    maskBase64: Property.LongText({
      displayName: 'Mask (Base64)',
      description:
        'PNG mask as a base64 data URI matching the image size; white areas are repainted, black kept.',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiApi.submitMidjourneyTask({
      auth,
      endpoint: 'modal',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          taskId: propsValue.taskId,
          customId: propsValue.customId,
          prompt: propsValue.prompt,
          maskBase64: propsValue.maskBase64,
        },
      }),
    });
  },
});
