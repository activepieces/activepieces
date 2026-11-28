import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingCreateLipSyncOutputSchema } from '../../../output-schemas';

export const klingCreateMultiElementVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_create_multi_element_video',
  outputSchema: cometapiKlingCreateLipSyncOutputSchema,
  displayName: 'Kling Create Multi-Element Video',
  description:
    'Starts a Kling edit that adds, swaps or removes the selected element of a video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts the billed final step of a Kling multi-element edit and returns its task_id and status; poll it with Kling Get Task using kind videos/multi-elements. Takes the session_id from Kling Init Video Selection after the region is marked with Kling Add Video Selection; addition and swap need Images, removal takes none.',
    idempotent: false,
  },
  props: {
    sessionId: cometApiAiProps.klingSessionId({ required: true }),
    editMode: Property.StaticDropdown({
      displayName: 'Edit Mode',
      description:
        'addition adds an element, swap replaces the selected one, removal removes it.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({
          values: ['addition', 'swap', 'removal'],
        }),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'The edit to make. Reference the video as <<<video_1>>> and an image as <<<image_1>>>.',
      required: true,
    }),
    imageList: Property.Array({
      displayName: 'Images',
      description: 'Reference images, required for addition and swap.',
      required: false,
      properties: {
        image: Property.ShortText({
          displayName: 'Image',
          description: 'Public image URL or base64 string.',
          required: true,
        }),
      },
    }),
    negativePrompt: cometApiAiProps.klingNegativePrompt({
      required: false,
      description: 'What to keep out of the result.',
    }),
    duration: cometApiAiProps.klingDuration({ required: false }),
    mode: cometApiAiProps.klingMode({ required: false }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { editMode } = propsValue;
    const imageList = propsValue.imageList ?? [];
    if (editMode !== 'removal' && imageList.length === 0) {
      throw new Error(`Images is required when Edit Mode is ${editMode}.`);
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/multi-elements',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          session_id: propsValue.sessionId,
          edit_mode: editMode,
          prompt: propsValue.prompt,
          image_list: imageList.length > 0 ? imageList : undefined,
          negative_prompt: propsValue.negativePrompt,
          duration: propsValue.duration,
          mode: propsValue.mode,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
