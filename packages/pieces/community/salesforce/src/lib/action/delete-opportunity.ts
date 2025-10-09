import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const deleteOpportunity = createAction({
  auth: salesforceAuth,
  name: 'delete_opportunity',
  displayName: 'Delete Opportunity',
  description: 'Deletes an Opportunity in Salesforce',
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'ID of the opportunity to delete',
      required: true,
    }),
  },
  async run(context) {
    const { opportunityId } = context.propsValue;

    const response = await callSalesforceApi(
      HttpMethod.DELETE,
      context.auth,
      `/services/data/v56.0/sobjects/Opportunity/${opportunityId}`,
      undefined
    );
    return {
      success: true,
      opportunityId: opportunityId,
      status: response.status,
    };
  },
});

