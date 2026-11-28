import { createAction, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiApi } from '../../../common/api';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMidjourneyActionOutputSchema } from '../../../output-schemas';

export const midjourneyActionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_action',
  outputSchema: cometapiMidjourneyActionOutputSchema,
  displayName: 'Midjourney Action',
  description:
    'Runs a button (upscale, variation, reroll, zoom, pan) on a finished Midjourney task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Presses one button of a finished Midjourney task: pass the task id and a customId from that task's buttons, both read with Midjourney Get Task. Returns the new task id in result to poll with Midjourney Get Task; code 21 means the button opened a modal (e.g. Vary Region, Custom Zoom) that must be completed with Midjourney Modal. Each call is a billed generation.",
    idempotent: false,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description:
        'ID of the finished task to continue from, from Midjourney Imagine or Midjourney Get Task.',
      required: true,
    }),
    customId: Property.ShortText({
      displayName: 'Custom ID',
      description:
        'customId of one of the task\'s buttons, e.g. "MJ::JOB::upsample::1::...", from Midjourney Get Task.',
      required: true,
    }),
    enableRemix: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Enable Remix',
      description: 'Force remix mode when the button supports it.',
      trueLabel: 'Yes',
      falseLabel: 'No',
    }),
    chooseSameChannel: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Same Account',
      description: 'Prefer the provider account that ran the original task.',
      trueLabel: 'Yes',
      falseLabel: 'No',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { enableRemix, chooseSameChannel } = propsValue;
    return await cometApiApi.submitMidjourneyTask({
      auth,
      endpoint: 'action',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          taskId: propsValue.taskId,
          customId: propsValue.customId,
          enableRemix: cometApiUtils.toBoolean({ value: enableRemix }),
          chooseSameChannel: cometApiUtils.toBoolean({
            value: chooseSameChannel,
          }),
        },
      }),
    });
  },
});
