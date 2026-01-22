import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

//  Endpoint: POST /public-api/actions/subscription-plans/v1.0/{subscriptionPlan}/replace

export const subscriptionPlanReplaceAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionPlanReplace',
  displayName: 'Actions - Subscription Plans - Replace',
  description: 'Replace a subscription plan with another one.',
  props: {
        
  subscriptionPlan: Property.Number({
    displayName: 'Subscription Plan',
    required: true,
  }),

  planId: Property.Number({
    displayName: 'Plan Id',
    description: 'The ID of the subscription plan that replaces the current one. The new Subscription plan will be added to the Subscription plans Restrictions for the Tariffs, where the old plan is present. Also it will be added to all Charge points that require the current Subscription plan.',
    required: true,
  }),

  replaceAt: Property.DateTime({
    displayName: 'Replace At',
    description: 'The date from which the new Subscription Plan replaces the current one. If left empty, it is replaced immediately.',
    required: false,
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: 'Internal note for tracking changes and the reasons for those changes.',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/subscription-plans/v1.0/{subscriptionPlan}/replace', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['planId', 'replaceAt', 'reason']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
