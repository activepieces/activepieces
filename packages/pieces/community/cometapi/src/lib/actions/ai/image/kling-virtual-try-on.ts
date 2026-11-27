import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingExpandImageOutputSchema } from '../../../output-schemas';

export const klingVirtualTryOnAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_virtual_try_on',
  outputSchema: cometapiKlingExpandImageOutputSchema,
  displayName: 'Kling Virtual Try-On',
  description:
    'Starts a Kling task that dresses a person image in a clothing image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Kolors virtual try-on task that puts the garment from a clothing image (top, bottom or one-piece dress) on the person in a person image, and returns data.task_id and data.task_status. Read the result with Kling Get Task (Task Kind images/kolors-virtual-try-on). Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    humanImage: cometApiAiProps.klingImage({
      required: true,
      displayName: 'Person Image',
    }),
    clothImage: cometApiAiProps.klingImage({
      required: true,
      displayName: 'Clothing Image',
    }),
    modelName: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Defaults to kolors-virtual-try-on-v1.',
      required: false,
      options: {
        options: [
          {
            label: 'kolors-virtual-try-on-v1',
            value: 'kolors-virtual-try-on-v1',
          },
          {
            label: 'kolors-virtual-try-on-v1-5',
            value: 'kolors-virtual-try-on-v1-5',
          },
        ],
      },
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/images/kolors-virtual-try-on',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model_name: propsValue.modelName,
          human_image: propsValue.humanImage,
          cloth_image: propsValue.clothImage,
        },
      }),
    });
  },
});
