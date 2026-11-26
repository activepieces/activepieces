import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { supabirdAuth } from '../auth';
import { supabirdRequest } from '../common/client';
import { socialSetDropdown } from '../common/props';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function buildPostingSlotBody(input: {
  weekday: string;
  localTime: string;
  tagName?: string;
  socialSet?: string;
}): Record<string, unknown> {
  const localTime = input.localTime.trim();
  if (!TIME_PATTERN.test(localTime)) {
    throw new Error(
      `"${input.localTime}" is not a valid time. Use 24-hour HH:MM, for example 09:30.`
    );
  }
  const body: Record<string, unknown> = {
    weekday: input.weekday,
    local_time: localTime,
  };
  const tagName = input.tagName?.trim();
  if (tagName) {
    body['tag_name'] = tagName;
  }
  if (input.socialSet) {
    body['social_set'] = input.socialSet;
  }
  return body;
}

export const addPostingSlotAction = createAction({
  auth: supabirdAuth,
  name: 'add_posting_slot',
  classification: 'WRITE',
  displayName: 'Add Posting Slot',
  description:
    'Add a weekly posting slot. Posts scheduled to the next free slot use these times.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a recurring weekly posting slot (weekday plus local time) to a SupaBird social set. Posts created with the next free slot option are placed in these slots. Fails with a conflict if the slot already exists.',
    idempotent: false,
  },
  props: {
    weekday: Property.StaticDropdown({
      displayName: 'Weekday',
      description: 'The day of the week for the slot.',
      required: true,
      defaultValue: 'monday',
      options: {
        options: [
          { label: 'Monday', value: 'monday' },
          { label: 'Tuesday', value: 'tuesday' },
          { label: 'Wednesday', value: 'wednesday' },
          { label: 'Thursday', value: 'thursday' },
          { label: 'Friday', value: 'friday' },
          { label: 'Saturday', value: 'saturday' },
          { label: 'Sunday', value: 'sunday' },
          { label: 'Today', value: 'today' },
          { label: 'Tomorrow', value: 'tomorrow' },
        ],
      },
    }),
    localTime: Property.ShortText({
      displayName: 'Time',
      description:
        'The time of day in your SupaBird time zone, 24-hour HH:MM, for example 09:30 or 18:00.',
      required: true,
    }),
    tagName: Property.ShortText({
      displayName: 'Tag',
      description:
        'Optional label for the slot, for example "launch" or "tips".',
      required: false,
    }),
    socialSet: socialSetDropdown,
  },
  async run(context) {
    const { body } = await supabirdRequest({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/posting-slots',
      body: buildPostingSlotBody(context.propsValue),
    });
    return body;
  },
});
