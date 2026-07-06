import { createAction, Property } from '@activepieces/pieces-framework';
import { waitwhileAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  customerIdDropdown,
  locationIdDropdown,
  visitIdDropdown,
} from '../common/props';

export const createOrUpdateAVisit = createAction({
  auth: waitwhileAuth,
  name: 'createOrUpdateAVisit',
  displayName: 'Create or Update a Visit',
  description: 'Create a new visit or update an existing visit in Waitwhile',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new waitlist/appointment visit or updates an existing one in Waitwhile, optionally linking a customer and location and setting notes, party size, and start time. Use to add someone to a queue or modify their visit; supply an existing visit id to update, or omit it to create. Idempotent when keyed on a stable visit id (re-running with the same id and inputs converges to the same record).',
    idempotent: true,
  },
  props: {
    id: visitIdDropdown,
    customerId: customerIdDropdown,
    locationId: locationIdDropdown,
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Visit notes',
      required: false,
    }),
    partySize: Property.Number({
      displayName: 'Party Size',
      description: 'Number of people in the party',
      required: false,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date/time in ISO format (e.g., 2024-01-01T10:00:00Z)',
      required: false,
    }),
  },
  async run(context) {
    const {
      id,
      customerId,
      locationId,
      notes,
      partySize,
      startDate,
    } = context.propsValue;
    const api_key = context.auth.secret_text;

    const body: any = {
      id,
    };

    if (customerId) {
      body['customerId'] = customerId;
    }
    if (locationId) {
      body['locationId'] = locationId;
    }
    if (notes) {
      body['notes'] = notes;
    }
    if (partySize !== undefined && partySize !== null) {
      body['partySize'] = partySize;
    }
    if (startDate) {
      body['startDate'] = startDate;
    }

    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      '/visits',
      body
    );
    return response;
  },
});
