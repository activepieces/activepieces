import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { magicalapiAuth, magicalapiCommon } from '../common';

export const scoreResume = createAction({
  auth: magicalapiAuth,
  name: 'scoreResume',
  displayName: 'Score Resume',
  description: 'Returns resume score.',
  props: magicalapiCommon.scoreResumeProperties,
  async run({ auth: apiKey, propsValue: { action, requestData } }) {
    if (action === 'create') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.scoreResumeSchema
      );
    } else if (action === 'check') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.checkResultSchema
      );
    }
    return await magicalapiCommon.scoreResume({
      apiKey,
      ...requestData,
    });
  },
});
