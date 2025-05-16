import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { CLOSE_API_URL } from "../common/constants";
import { closeCrmAuth } from "../../index";

export const createOpportunity = createAction({
  auth: closeCrmAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Log a new opportunity linked to a lead.',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead this opportunity is associated with. If omitted, a new lead will be created (not recommended for typical use).',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'A note for the opportunity.',
      required: false,
    }),
    confidence: Property.Number({
      displayName: 'Confidence',
      description: 'Confidence level (0-100) for this opportunity.',
      required: false,
    }),
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'ID of the opportunity status. If omitted, the default status will be used.',
      required: false,
    }),
    value: Property.Number({
        displayName: 'Value (in cents)',
        description: 'Monetary value of the opportunity in cents (e.g., 50000 for $500.00).',
        required: false,
    }),
    value_period: Property.StaticDropdown({
        displayName: 'Value Period',
        description: "Period for the value (one_time, monthly, annual). Required if 'Value' is set.",
        required: false,
        options: {
            options: [
                { label: 'One-Time', value: 'one_time' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Annual', value: 'annual' },
            ]
        }
    }),
    user_id: Property.ShortText({
        displayName: 'User ID',
        description: 'ID of the user to assign this opportunity to.',
        required: false,
    }),
    contact_id: Property.ShortText({
        displayName: 'Contact ID',
        description: 'ID of the contact (on the lead) to associate with this opportunity.',
        required: false,
    }),
    date_won: Property.ShortText({
        displayName: 'Date Won (YYYY-MM-DD)',
        description: "Date the opportunity was won. Automatically set if status is 'won' and this is not provided.",
        required: false,
    })
  },
  async run(context) {
    const { lead_id, note, confidence, status_id, value, value_period, user_id, contact_id, date_won } = context.propsValue;
    const apiKey = context.auth;

    const payload: any = {
      lead_id: lead_id,
    };

    if (note) payload.note = note;
    if (confidence !== undefined && confidence !== null) payload.confidence = confidence;
    if (status_id) payload.status_id = status_id;
    if (value !== undefined && value !== null) {
        payload.value = value;
        if (value_period) {
            payload.value_period = value_period;
        } else {
            // Consider throwing an error or Close API might handle it.
            // For now, rely on Close API validation if value is set but period is not.
        }
    }
    if (user_id) payload.user_id = user_id;
    if (contact_id) payload.contact_id = contact_id;
    if (date_won) payload.date_won = date_won;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/opportunity/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
