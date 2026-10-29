import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoBookingsAuth } from '../auth';
import { zohoBookingsApi } from '../common/api';
import { zohoBookingsProps } from '../common/props';
import { fetchAvailabilityOutputSchema } from '../output-schemas';

export const fetchAvailabilityAction = createAction({
  auth: zohoBookingsAuth,
  name: 'fetchAvailability',
  outputSchema: fetchAvailabilityOutputSchema,
  classification: 'SEARCH',
  displayName: 'Fetch Availability',
  description: 'Fetch availability of appointments across services',
  audience: 'human',
  aiMetadata: {
    description:
      'Look up open appointment slots for a service in a Zoho Bookings workspace on a given date. Scope the lookup to exactly one of staff, group, or resource (the call fails if none is supplied). Use this before booking to find valid times. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: zohoBookingsProps.workspaceId({
      required: true,
      description: 'Select the workspace to fetch availability for',
    }),
    service_id: zohoBookingsProps.serviceId({
      required: true,
      description: 'Select the service for which availability is to be fetched',
    }),
    staff_id: zohoBookingsProps.staffId({
      required: false,
      description: 'Select the staff member (use this OR group_id OR resource_id)',
    }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description:
        'The unique ID of the staff group associated with the service (use this OR staff_id OR resource_id)',
      required: false,
    }),
    resource_id: zohoBookingsProps.resourceId({ required: false }),
    selected_date: Property.DateTime({
      displayName: 'Selected Date',
      description:
        'The date on which services are checked for availability (format: mm-dd-yyyy)',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    await propsValidation.validateZod(propsValue, schema);

    if (!propsValue.staff_id && !propsValue.group_id && !propsValue.resource_id) {
      throw new Error('Either staff_id, group_id, or resource_id must be provided');
    }

    return await zohoBookingsApi.getAvailableSlots({
      auth,
      serviceId: propsValue.service_id,
      selectedDate: propsValue.selected_date,
      staffId: propsValue.staff_id,
      groupId: propsValue.group_id,
      resourceId: propsValue.resource_id,
    });
  },
});

const schema = {
  workspace_id: z.string().check(z.minLength(1)),
  service_id: z.string().check(z.minLength(1)),
  staff_id: z.optional(z.string()),
  group_id: z.optional(z.string()),
  resource_id: z.optional(z.string()),
  selected_date: z.string(),
};
