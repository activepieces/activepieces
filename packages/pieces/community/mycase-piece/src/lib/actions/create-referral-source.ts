import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createReferralSource = createAction({
  auth: mycaseAuth,
  name: 'create_referral_source',
  displayName: 'Create Referral Source',
  description: 'Creates a new referral source in MyCase',
  props: {
    name: Property.ShortText({
      displayName: 'Referral Source Name',
      description: 'The name of the referral source',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    const requestBody = {
      name: context.propsValue.name,
    };

    try {
      const response = await api.post('/referral_sources', requestBody);
      
      if (response.success) {
        return {
          success: true,
          referral_source: response.data,
          message: `Referral source "${context.propsValue.name}" created successfully`,
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create referral source',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});