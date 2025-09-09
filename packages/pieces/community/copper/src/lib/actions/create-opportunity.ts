import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const createOpportunity = createAction({
  auth: copperAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Adds a new opportunity to Copper CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the opportunity',
      required: true,
    }),
    primaryContactId: Property.Number({
      displayName: 'Primary Contact ID',
      description: 'ID of the primary contact for this opportunity',
      required: false,
    }),
    customerSourceId: Property.Number({
      displayName: 'Customer Source ID',
      description: 'ID of the customer source for this opportunity',
      required: false,
    }),
    companyId: Property.Number({
      displayName: 'Company ID',
      description: 'ID of the company associated with this opportunity',
      required: false,
    }),
    pipelineId: Property.Number({
      displayName: 'Pipeline ID',
      description: 'ID of the pipeline for this opportunity',
      required: false,
    }),
    pipelineStageId: Property.Number({
      displayName: 'Pipeline Stage ID',
      description: 'ID of the pipeline stage for this opportunity',
      required: false,
    }),
    monetaryValue: Property.Number({
      displayName: 'Monetary Value',
      description: 'Expected monetary value of the opportunity',
      required: false,
    }),
    assigneeId: Property.Number({
      displayName: 'Assignee ID',
      description: 'ID of the user assigned to this opportunity',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the opportunity',
      required: false,
    }),
    closeDate: Property.ShortText({
      displayName: 'Close Date',
      description: 'Expected close date (YYYY-MM-DD format)',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Priority level for this opportunity',
      required: false,
      defaultValue: 'None',
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'None' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      },
    }),
    customField1Id: Property.Number({
      displayName: 'Custom Field 1 ID',
      description: 'ID of the first custom field definition',
      required: false,
    }),
    customField1Value: Property.ShortText({
      displayName: 'Custom Field 1 Value',
      description: 'Value for the first custom field',
      required: false,
    }),
    customField2Id: Property.Number({
      displayName: 'Custom Field 2 ID',
      description: 'ID of the second custom field definition',
      required: false,
    }),
    customField2Value: Property.ShortText({
      displayName: 'Custom Field 2 Value',
      description: 'Value for the second custom field',
      required: false,
    }),
    customField3Id: Property.Number({
      displayName: 'Custom Field 3 ID',
      description: 'ID of the third custom field definition',
      required: false,
    }),
    customField3Value: Property.ShortText({
      displayName: 'Custom Field 3 Value',
      description: 'Value for the third custom field',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      primaryContactId,
      customerSourceId,
      companyId,
      pipelineId,
      pipelineStageId,
      monetaryValue,
      assigneeId,
      details,
      closeDate,
      priority,
      customField1Id,
      customField1Value,
      customField2Id,
      customField2Value,
      customField3Id,
      customField3Value,
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {
      name: name,
    };

    // Add optional fields if provided
    if (primaryContactId) {
      requestBody.primary_contact_id = primaryContactId;
    }
    if (customerSourceId) {
      requestBody.customer_source_id = customerSourceId;
    }
    if (companyId) {
      requestBody.company_id = companyId;
    }
    if (pipelineId) {
      requestBody.pipeline_id = pipelineId;
    }
    if (pipelineStageId) {
      requestBody.pipeline_stage_id = pipelineStageId;
    }
    if (monetaryValue) {
      requestBody.monetary_value = monetaryValue;
    }
    if (assigneeId) {
      requestBody.assignee_id = assigneeId;
    }
    if (details) {
      requestBody.details = details;
    }
    if (closeDate) {
      requestBody.close_date = closeDate;
    }
    if (priority && priority !== 'None') {
      requestBody.priority = priority;
    }

    // Add custom fields if provided
    const customFields = [];
    if (customField1Id && customField1Value) {
      customFields.push({
        custom_field_definition_id: customField1Id,
        value: customField1Value,
      });
    }
    if (customField2Id && customField2Value) {
      customFields.push({
        custom_field_definition_id: customField2Id,
        value: customField2Value,
      });
    }
    if (customField3Id && customField3Value) {
      customFields.push({
        custom_field_definition_id: customField3Id,
        value: customField3Value,
      });
    }

    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/opportunities',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: requestBody,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      }
      throw new Error(`Error creating opportunity: ${error.message}`);
    }
  },
});
