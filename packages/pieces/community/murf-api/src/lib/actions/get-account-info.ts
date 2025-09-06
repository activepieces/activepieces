import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { murfCommon } from '../common/client';
import { API_ENDPOINTS } from '../common/common';

export const getAccountInfoAction = createAction({
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
  }),
  name: 'get-account-info',
  displayName: 'Get Account Info',
  description: 'Get your account information including credits and usage limits',
  props: {},
  async run(context) {
    try {
      const response = await murfCommon.apiCallWithToken({
        apiKey: context.auth,
        method: 'GET' as any,
        resourceUri: '/v1/account/info',
      });

      return {
        accountInfo: response.body,
        credits: response.body.credits || response.body.remainingCredits,
        usage: response.body.usage || response.body.usedCredits,
        limits: response.body.limits || response.body.planLimits,
        plan: response.body.plan || response.body.subscription,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Murf API key in your account settings.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }

      throw new Error(`Failed to get account info: ${error.message || 'Unknown error'}. Please try again or contact support if the issue persists.`);
    }
  },
});
