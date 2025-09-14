import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { magicalapiAuth, magicalapiCommon } from '../common';

export const reviewResume = createAction({
  auth: magicalapiAuth,
  name: 'reviewResume',
  displayName: 'Review Resume',
  description: 'Analyze parsed resume using predefined criteria.',
  props: magicalapiCommon.reviewResumeProperties,
  async run({ auth: apiKey, propsValue: { action, requestData } }) {
    if (action === 'create') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.reviewResumeSchema
      );
    } else if (action === 'check') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.checkResultSchema
      );
    }
    return await magicalapiCommon.reviewResume({
      apiKey,
      ...requestData,
    });
  },
});
