import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAuth } from '../..';
import { queryMetabaseApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getQuestionPngPreview = createAction({
  name: 'getQuestionPngPreview',
  auth: metabaseAuth,
  requireAuth: true,
  displayName: 'Get Question PNG Preview',
  description:
    'Get PNG preview rendering (low resolution) of a Metabase card/question.',
  props: {
    questionId: Property.ShortText({
      displayName: 'Metabase question ID',
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    const questionId = propsValue.questionId.split('-')[0];

    const response = await queryMetabaseApi(
      {
        endpoint: `pulse/preview_card_png/${questionId}`,
        method: HttpMethod.GET,
        headers: {
          Accept: 'image/png',
        },
        responseType: 'arraybuffer',
      },
      auth
    );

    if (response.error) {
      throw new Error(response.error);
    }

    const fileUrl = await files.write({
      fileName: `metabase_question_${questionId}.png`,
      data: Buffer.from(response, 'base64'),
    });

    return {
      fileName: `metabase_question_${questionId}.png`,
      file: fileUrl,
    };
  },
});
