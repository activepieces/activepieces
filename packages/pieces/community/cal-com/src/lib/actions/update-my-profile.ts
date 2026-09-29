import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { profileActionOutputSchema } from '../output-schemas';

export const calcomUpdateMyProfile = createAction({
  auth: calcomAuth,
  name: 'calcom_update_my_profile',
  classification: 'WRITE',
  displayName: 'Update My Profile',
  description: 'Update the connected Cal.com user\'s own profile. Only the fields you set are changed.',
  audience: 'ai',
  outputSchema: profileActionOutputSchema,
  aiMetadata: {
    description:
      'Partially updates the authenticated user\'s own profile: an omitted field keeps its current value. To clear Bio, pass a single space; Cal.com silently ignores a true empty string. Idempotent: repeating with the same input yields the same final state.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone, e.g. Europe/Berlin. Get valid values from List Timezones.',
      required: false,
    }),
    default_schedule_id: Property.Number({
      displayName: 'Default Schedule ID',
      description: 'Get this from List Schedules.',
      required: false,
    }),
    week_start: Property.ShortText({
      displayName: 'Week Start',
      description: 'e.g. Monday.',
      required: false,
    }),
    time_format: Property.StaticDropdown({
      displayName: 'Time Format',
      required: false,
      options: {
        options: [
          { label: '12-hour', value: '12' },
          { label: '24-hour', value: '24' },
        ],
      },
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      required: false,
    }),
    bio: Property.LongText({
      displayName: 'Bio',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      name,
      email,
      time_zone,
      default_schedule_id,
      week_start,
      time_format,
      locale,
      bio,
    } = propsValue;

    const body: Record<string, unknown> = {};
    if (name !== undefined) body['name'] = name;
    if (email !== undefined) body['email'] = email;
    if (time_zone !== undefined) body['timeZone'] = time_zone;
    if (default_schedule_id !== undefined) body['defaultScheduleId'] = default_schedule_id;
    if (week_start !== undefined) body['weekStart'] = week_start;
    if (time_format !== undefined) body['timeFormat'] = Number(time_format);
    if (locale !== undefined) body['locale'] = locale;
    if (bio !== undefined) body['bio'] = bio;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.PATCH,
      path: '/me',
      body,
    });
  },
});
