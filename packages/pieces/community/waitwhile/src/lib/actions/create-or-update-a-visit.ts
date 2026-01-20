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
