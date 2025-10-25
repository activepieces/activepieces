import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Deal } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateDealAction = createAction({
  auth: zendeskSellAuth,
  name: 'update_deal',
  displayName: 'Update Deal',
  description: 'Update deal fields (amount, stage, close date)',
  props: {
    name: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Name of the deal',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Deal Value',
      description: 'Monetary value of the deal',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., USD, EUR)',
      required: false,
    }),
    hot: Property.Checkbox({
      displayName: 'Hot Deal',
      description: 'Mark as a hot deal',
      required: false,
    }),
    stageId: Property.Number({
      displayName: 'Stage ID',
      description: 'Pipeline stage ID',
      required: false,
    }),
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'Associated contact ID',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'ID of the user who owns this deal',
      required: false,
    }),
    estimatedCloseDate: Property.ShortText({
      displayName: 'Estimated Close Date',
      description: 'Expected close date (YYYY-MM-DD)',
      required: false,
    }),
    customizedWinLikelihood: Property.Number({
      displayName: 'Win Likelihood',
      description: 'Percentage likelihood of winning (0-100)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field values as JSON object',
      required: false,
    }),
  },
  async run(context) {
    const dealData: any = {
      data: {},
    };

    if (context.propsValue.name) dealData.data.name = context.propsValue.name;
    if (context.propsValue.value !== undefined) dealData.data.value = context.propsValue.value;
    if (context.propsValue.currency) dealData.data.currency = context.propsValue.currency;
    if (context.propsValue.hot !== undefined) dealData.data.hot = context.propsValue.hot;
    if (context.propsValue.stageId) dealData.data.stage_id = context.propsValue.stageId;
    if (context.propsValue.contactId) dealData.data.contact_id = context.propsValue.contactId;
    if (context.propsValue.ownerId) dealData.data.owner_id = context.propsValue.ownerId;
    if (context.propsValue.estimatedCloseDate) dealData.data.estimated_close_date = context.propsValue.estimatedCloseDate;
    if (context.propsValue.customizedWinLikelihood !== undefined) dealData.data.customized_win_likelihood = context.propsValue.customizedWinLikelihood;
    if (context.propsValue.tags) dealData.data.tags = context.propsValue.tags;
    if (context.propsValue.customFields) dealData.data.custom_fields = context.propsValue.customFields;

    const response = await makeZendeskSellRequest<{ data: Deal }>(
      context.auth,
      HttpMethod.PUT,
      `/deals/${context.propsValue.stageId}`,
      dealData
    );

    return {
      success: true,
      deal: response.data,
    };
  },
});