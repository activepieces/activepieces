import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  companyIdDropdown,
  contactIdDropdown,
  createRecordIdDropdown,
  pipelineIdDropdown,
  productidDropdown,
  tagDropdown,
  userIdDropdown,
} from '../common/props';

export const updatePipelineRecord = createAction({
  auth: biginAuth,
  name: 'updatePipelineRecord',
  displayName: 'Update Pipeline Record',
  description: 'Update an existing pipeline record (deal) in Bigin',
  props: {
    recordId: pipelineIdDropdown,
    owner: userIdDropdown,
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Provide the name for the pipeline record (deal)',
      required: false,
    }),
    accountName: companyIdDropdown,
    contactName: contactIdDropdown,
    subPipeline: Property.ShortText({
      displayName: 'Sub Pipeline',
      description:
        'Provide the name of the Sub-Pipeline to which the pipeline record (deal) belongs',
      required: false,
    }),
    stage: Property.ShortText({
      displayName: 'Stage',
      description:
        'Provide the current stage of the pipeline record (deal) within the Sub-Pipeline',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of the pipeline record (deal)',
      required: false,
    }),
    secondaryContacts: createRecordIdDropdown(
      'Contacts',
      'Secondary Contacts',
      'Provide a list of additional contacts associated with the pipeline record (deal)'
    ),
    closingDate: Property.ShortText({
      displayName: 'Closing Date',
      description:
        'Provide the expected or actual closing date of the pipeline record (deal) in YYYY-MM-DD format',
      required: false,
    }),
    tag: tagDropdown('Pipelines'),
    pipeline: pipelineIdDropdown,
    associatedProducts: productidDropdown,
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: context.propsValue.recordId,
    };

    // Add optional fields if provided
    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.dealName)
      body['Deal_Name'] = context.propsValue.dealName;
    if (context.propsValue.accountName)
      body['Account_Name'] = context.propsValue.accountName;
    if (context.propsValue.contactName)
      body['Contact_Name'] = context.propsValue.contactName;
    if (context.propsValue.subPipeline)
      body['Sub_Pipeline'] = context.propsValue.subPipeline;
    if (context.propsValue.stage) body['Stage'] = context.propsValue.stage;
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
      HttpMethod.PUT,
      '/Pipelines',
      context.auth.props?.['location'] || 'com',
      {
        data: [body],
      }
    );

    return response.data[0];
  },
});
