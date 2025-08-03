import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { userIdDropdown } from '../common/props';

export const createPipelineRecord = createAction({
  auth: biginAuth,
  name: 'createPipelineRecord',
  displayName: 'Create Pipeline Record',
  description: 'Create a new pipeline record (deal) in Bigin',
  props: {
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Provide the name for the pipeline record (deal)',
      required: true,
    }),

    subPipeline: Property.ShortText({
      displayName: 'Sub Pipeline',
      description:
        'Provide the name of the Sub-Pipeline to which the pipeline record (deal) belongs',
      required: true,
    }),
    stage: Property.ShortText({
      displayName: 'Stage',
      description:
        'Provide the current stage of the pipeline record (deal) within the Sub-Pipeline',
      required: true,
    }),
    owner: userIdDropdown,
    accountName: Property.Json({
      displayName: 'Account Name',
      description:
        'The ID of the company to which the pipeline record (deal) will be associated. You can get the company ID from the Get records API.',
      required: false,
    }),
    contactName: Property.Json({
      displayName: 'Contact Name',
      description:
        'The ID of the contact to which the pipeline record (deal) will be assigned. You can get the contact ID from the Get records API.',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of the pipeline record (deal)',
      required: false,
    }),
    secondaryContacts: Property.Json({
      displayName: 'Secondary Contacts',
      description:
        'Provide a list of additional contacts associated with the pipeline record (deal)',
      required: false,
    }),
    closingDate: Property.ShortText({
      displayName: 'Closing Date',
      description:
        'Provide the expected or actual closing date of the pipeline record (deal) in YYYY-MM-DD format',
      required: false,
    }),
    tag: Property.Json({
      displayName: 'Tag',
      description:
        'Provide the list of tags that can be associated with the pipeline record (deal). You can get the list of tags from the Get all tags API',
      required: false,
    }),
    pipeline: Property.Json({
      displayName: 'Pipeline',
      description:
        'Provide the name and ID of the Team Pipeline to which the pipeline record (deal) belongs. You can get the Team Pipeline ID from the Get layouts metadata API.',
      required: false,
    }),
    associatedProducts: Property.Json({
      displayName: 'Associated Products',
      description:
        'Provide the list of products in JSON format that need to be associated with the pipeline record (deal). You can get the product ID from the Get records API.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      Deal_Name: context.propsValue.dealName,
      Sub_Pipeline: context.propsValue.subPipeline,
      Stage: context.propsValue.stage,
    };

    // Add optional fields if provided
    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.accountName)
      body['Account_Name'] = context.propsValue.accountName;
    if (context.propsValue.contactName)
      body['Contact_Name'] = context.propsValue.contactName;
    if (context.propsValue.amount !== undefined)
      body['Amount'] = context.propsValue.amount;
    if (context.propsValue.secondaryContacts)
      body['Secondary_Contacts'] = context.propsValue.secondaryContacts;
    if (context.propsValue.closingDate)
      body['Closing_Date'] = context.propsValue.closingDate;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;
    if (context.propsValue.pipeline)
      body['Pipeline'] = context.propsValue.pipeline;
    if (context.propsValue.associatedProducts)
      body['Associated_Products'] = context.propsValue.associatedProducts;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Pipelines',
      {
        data: [body],
      }
    );

    return {
      message: 'Pipeline record (deal) created successfully',
      data: response.data[0],
    };
  },
});
