import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const updateOpportunity = createAction({
  auth: copperAuth,
  name: 'update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity. Only specified fields will be updated.',
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'The ID of the opportunity to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the opportunity',
      required: false,
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
    lossReasonId: Property.Number({
      displayName: 'Loss Reason ID',
      description: 'ID of the loss reason if opportunity is lost',
      required: false,
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
    clearCloseDate: Property.Checkbox({
      displayName: 'Clear Close Date',
      description: 'Set to true to remove the close date field (set to null)',
      required: false,
      defaultValue: false,
    }),
    clearMonetaryValue: Property.Checkbox({
      displayName: 'Clear Monetary Value',
      description: 'Set to true to remove the monetary value field (set to null)',
      required: false,
      defaultValue: false,
    }),
    clearPrimaryContact: Property.Checkbox({
      displayName: 'Clear Primary Contact',
      description: 'Set to true to remove the primary contact field (set to null)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      opportunityId,
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
      lossReasonId,
      customField1Id,
      customField1Value,
      customField2Id,
      customField2Value,
      customField3Id,
      customField3Value,
      clearCloseDate,
      clearMonetaryValue,
      clearPrimaryContact,
    } = context.propsValue;

    // Build the request body - only include fields that are provided
    const requestBody: any = {};

    // Add basic fields if provided
    if (name !== undefined && name !== '') {
      requestBody.name = name;
    }
    if (details !== undefined && details !== '') {
      requestBody.details = details;
    }
    if (customerSourceId !== undefined) {
      requestBody.customer_source_id = customerSourceId;
    }
    if (companyId !== undefined) {
      requestBody.company_id = companyId;
    }
    if (pipelineId !== undefined) {
      requestBody.pipeline_id = pipelineId;
    }
    if (pipelineStageId !== undefined) {
      requestBody.pipeline_stage_id = pipelineStageId;
    }
    if (assigneeId !== undefined) {
      requestBody.assignee_id = assigneeId;
    }
    if (priority && priority !== 'None') {
      requestBody.priority = priority;
    }
    if (lossReasonId !== undefined) {
      requestBody.loss_reason_id = lossReasonId;
    }

    // Handle close date - either update, clear, or leave unchanged
    if (clearCloseDate) {
      requestBody.close_date = null;
    } else if (closeDate !== undefined && closeDate !== '') {
      requestBody.close_date = closeDate;
    }

    // Handle monetary value - either update, clear, or leave unchanged
    if (clearMonetaryValue) {
      requestBody.monetary_value = null;
    } else if (monetaryValue !== undefined) {
      requestBody.monetary_value = monetaryValue;
    }

    // Handle primary contact - either update, clear, or leave unchanged
    if (clearPrimaryContact) {
      requestBody.primary_contact_id = null;
    } else if (primaryContactId !== undefined) {
      requestBody.primary_contact_id = primaryContactId;
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

    // If no fields are provided, return early
    if (Object.keys(requestBody).length === 0) {
      throw new Error('No fields provided for update. Please specify at least one field to update.');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://api.copper.com/developer_api/v1/opportunities/${opportunityId}`,
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
      if (error.response?.status === 404) {
        throw new Error(`Opportunity with ID ${opportunityId} not found.`);
      }
      throw new Error(`Error updating opportunity: ${error.message}`);
    }
  },
});
