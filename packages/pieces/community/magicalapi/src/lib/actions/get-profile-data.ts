import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { magicalapiAuth, magicalapiCommon } from '../common';

export const getProfileData = createAction({
  auth: magicalapiAuth,
  name: 'getProfileData',
  displayName: 'Get Profile Data',
  description: 'Given a person identifier (name, email, LinkedIn URL), retrieve profile metadata.',
  props: magicalapiCommon.getProfileDataProperties,
  async run({ auth: apiKey, propsValue: { action, requestData } }) {
    if (action === 'create') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.getProfileDataSchema
      );
    } else if (action === 'check') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.checkResultSchema
      );
    }
    return await magicalapiCommon.getProfileData({
      apiKey,
      ...requestData,
    });
  },
});
