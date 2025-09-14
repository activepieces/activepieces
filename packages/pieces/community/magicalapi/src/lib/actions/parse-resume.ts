import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { magicalapiAuth, magicalapiCommon } from '../common';

export const parseResume = createAction({
  auth: magicalapiAuth,
  name: 'parseResume',
  displayName: 'Parse Resume',
  description:
    'Extract structured data (name, email, experience, skills, etc.) from a resume file.',
  props: magicalapiCommon.parseResumeProperties,
  async run({ auth: apiKey, propsValue: { action, requestData } }) {
    if (action === 'create') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.parseResumeSchema
      );
    } else if (action === 'check') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.checkResultSchema
      );
    }
    return await magicalapiCommon.parseResume({
      apiKey,
      ...requestData,
    });
  },
});
