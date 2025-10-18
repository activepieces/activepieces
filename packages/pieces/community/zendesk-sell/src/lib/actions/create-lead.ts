import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Lead } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLeadAction = createAction({
  auth: zendeskSellAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Create a lead record',
  props: {
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the lead',
      required: true,
    }),
    organizationName: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Company/organization name',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the lead',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile number',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Lead status (e.g., New, Contacted, Qualified)',
      required: false,
    }),
    sourceId: Property.Number({
      displayName: 'Source ID',
      description: 'ID of the lead source',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'ID of the user who owns this lead',
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
    const leadData: any = {
      data: {
        last_name: context.propsValue.lastName,
      },
    };

    if (context.propsValue.firstName) leadData.data.first_name = context.propsValue.firstName;
    if (context.propsValue.email) leadData.data.email = context.propsValue.email;
    if (context.propsValue.phone) leadData.data.phone = context.propsValue.phone;
    if (context.propsValue.mobile) leadData.data.mobile = context.propsValue.mobile;
    if (context.propsValue.title) leadData.data.title = context.propsValue.title;
    if (context.propsValue.description) leadData.data.description = context.propsValue.description;
    if (context.propsValue.organizationName) leadData.data.organization_name = context.propsValue.organizationName;
    if (context.propsValue.status) leadData.data.status = context.propsValue.status;
    if (context.propsValue.sourceId) leadData.data.source_id = context.propsValue.sourceId;
    if (context.propsValue.ownerId) leadData.data.owner_id = context.propsValue.ownerId;
    if (context.propsValue.tags) leadData.data.tags = context.propsValue.tags;
    if (context.propsValue.customFields) leadData.data.custom_fields = context.propsValue.customFields;

    const response = await makeZendeskSellRequest<{ data: Lead }>(
      context.auth,
      HttpMethod.POST,
      '/leads',
      leadData
    );

    return {
      success: true,
      lead: response.data,
    };
  },
});