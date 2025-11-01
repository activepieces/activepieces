import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findOrCreateReferralSource = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_referral_source',
  displayName: 'Find or Create Referral Source',
  description: 'Finds a referral source by name or creates a new one if it does not exist',
  props: {
    name: Property.ShortText({
      displayName: 'Referral Source Name',
      description: 'The name of the referral source to find or create',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    const referralSourceName = context.propsValue.name;

    try {
      // First, try to find the referral source
      const findResponse = await api.get('/referral_sources', {
        page_size: '1000'
      });

      if (findResponse.success && Array.isArray(findResponse.data)) {
        const existingReferralSource = findResponse.data.find(
          (rs: any) => rs.name && rs.name.toLowerCase() === referralSourceName.toLowerCase()
        );

        if (existingReferralSource) {
          return {
            success: true,
            referral_source: existingReferralSource,
            created: false,
            message: `Referral source "${referralSourceName}" found`
          };
        }
      }

      // Referral source not found, create a new one
      const requestBody = {
        name: referralSourceName,
      };

      const createResponse = await api.post('/referral_sources', requestBody);

      if (createResponse.success) {
        return {
          success: true,
          referral_source: createResponse.data,
          created: true,
          message: `Referral source "${referralSourceName}" created successfully`
        };
      } else {
        return {
          success: false,
          error: createResponse.error,
          details: createResponse.details
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find or create referral source',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
