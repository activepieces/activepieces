import { createAction, Property } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createOpportunity = createAction({
  auth: sellsyAuth,
  name: 'createOpportunity',
  displayName: 'Create Opportunity',
  description: 'Create a new opportunity in Sellsy',
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the opportunity',
      required: true,
    }),
    pipeline: Property.Number({
      displayName: 'Pipeline ID',
      description: 'Pipeline ID for the opportunity',
      required: true,
    }),
    step: Property.Number({
      displayName: 'Pipeline Step ID',
      description: 'Pipeline step ID for the opportunity',
      required: true,
    }),
    related_type: Property.StaticDropdown({
      displayName: 'Related To',
      description: 'Type of entity this opportunity is related to',
      required: true,
      options: {
        options: [
          { label: 'Company', value: 'company' },
          { label: 'Individual', value: 'individual' },
        ],
      },
    }),
    related_id: Property.Number({
      displayName: 'Related Entity ID',
      description: 'ID of the company or individual this opportunity is related to',
      required: true,
    }),
    owner_id: Property.Number({
      displayName: 'Owner ID',
      description: 'Owner of the opportunity (Staff ID). If not provided, logged-in staff will be used',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Opportunity status',
      required: false,
      defaultValue: 'open',
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Closed', value: 'closed' },
          { label: 'Late', value: 'late' },
        ],
      },
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'Potential opportunity amount (in default currency)',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'Opportunity probability (0-100)',
      required: false,
    }),
    source: Property.Number({
      displayName: 'Source ID',
      description: 'Source of opportunity creation',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date of the opportunity (YYYY-MM-DD format)',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Opportunity note',
      required: false,
    }),
    main_doc_id: Property.Number({
      displayName: 'Main Document ID',
      description: 'Internal ID of the main opportunity document',
      required: false,
    }),
    assigned_staff_ids: Property.Array({
      displayName: 'Assigned Staff IDs',
      description: 'Array of staff IDs assigned to the opportunity',
      required: false,
    }),
    contact_ids: Property.Array({
      displayName: 'Contact IDs',
      description: 'Array of contact IDs responsible for the opportunity',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Opportunity Number',
      description: 'Custom opportunity number',
      required: false,
    }),
    verify: Property.Checkbox({
      displayName: 'Verify Only',
      description: 'Set to true to validate payload without persisting data',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Build related array based on type
    const related = [{
      type: propsValue.related_type,
      id: propsValue.related_id,
    }];

    const opportunityData: any = {
      name: propsValue.name,
      pipeline: propsValue.pipeline,
      step: propsValue.step,
      related: related,
    };

    // Add optional fields if provided
    if (propsValue.owner_id) opportunityData.owner_id = propsValue.owner_id;
    if (propsValue.status) opportunityData.status = propsValue.status;
    if (propsValue.amount) opportunityData.amount = propsValue.amount;
    if (propsValue.probability !== undefined) opportunityData.probability = propsValue.probability;
    if (propsValue.source) opportunityData.source = propsValue.source;
    if (propsValue.due_date) opportunityData.due_date = propsValue.due_date;
    if (propsValue.note) opportunityData.note = propsValue.note;
    if (propsValue.main_doc_id) opportunityData.main_doc_id = propsValue.main_doc_id;
    if (propsValue.assigned_staff_ids) opportunityData.assigned_staff_ids = propsValue.assigned_staff_ids;
    if (propsValue.contact_ids) opportunityData.contact_ids = propsValue.contact_ids;
    if (propsValue.number) opportunityData.number = propsValue.number;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (propsValue.verify) {
      queryParams.append('verify', 'true');
    }

    const queryString = queryParams.toString();
    const path = `/opportunities${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      path,
      opportunityData
    );

    return response;
  },
});