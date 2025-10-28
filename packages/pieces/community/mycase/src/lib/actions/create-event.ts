import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import {
  caseDropdown,
  locationDropdown,
  multiStaffDropdown,
} from '../common/props';

export const createEvent = createAction({
  auth: myCaseAuth,
  name: 'createEvent',
  displayName: 'Create Event',
  description: 'Creates a new event',
  props: {
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of this event',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Event description',
      required: false,
    }),
    start: Property.DateTime({
      displayName: 'Start Date/Time',
      description: 'The start date/time of this event',
      required: true,
    }),
    end: Property.DateTime({
      displayName: 'End Date/Time',
      description: 'The end date/time of this event',
      required: true,
    }),
    all_day: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Specify Whether this is an all day event',
      required: false,
      defaultValue: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private Event',
      description: 'Specify Whether this is a private event',
      required: false,
      defaultValue: false,
    }),
    location_id: locationDropdown({
      description: 'Select a location for this event',
      required: false,
    }),
    case_id: caseDropdown({
      description: 'Select a case to associate with this event',
      required: false,
    }),
    staff_ids: multiStaffDropdown({
      description: 'Select staff members for this event',
      required: true,
    }),
    required_staff_ids: multiStaffDropdown({
      description: 'Select staff members who are required to attend',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const staffIds = Array.isArray(propsValue.staff_ids)
      ? propsValue.staff_ids
      : [];
    const requiredStaffIds = Array.isArray(propsValue.required_staff_ids)
      ? propsValue.required_staff_ids
      : [];

    const requiredSet = new Set(requiredStaffIds);

    const staff = staffIds.map((staffId) => ({
      id: staffId,
      required: requiredSet.has(staffId),
    }));

    const payload: any = {
      name: propsValue.name,
      description: propsValue.description,
      start: propsValue.start,
      end: propsValue.end,
      all_day: propsValue.all_day,
      private: propsValue.private,
      staff,
    };

    if (propsValue.location_id) {
      payload.location = { id: propsValue.location_id };
    }

    if (propsValue.case_id) {
      payload.case = { id: propsValue.case_id };
    }

    return await myCaseApiService.createEvent({
      accessToken: auth.access_token,
      payload,
    });
  },
});
