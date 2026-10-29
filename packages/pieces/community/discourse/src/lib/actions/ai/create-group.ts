import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const createGroupAction = createAction({
  auth: discourseAuth,
  name: 'create_group',
  classification: 'WRITE',
  displayName: 'Create Group',
  description: 'Creates a Discourse group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a Discourse group with a unique name (letters, numbers, dashes, underscores), optional full name, bio and visibility, and optional initial members. Needs an admin key. A retry after success fails with "name already taken" rather than duplicating.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Unique group name, no spaces.', required: true }),
    full_name: Property.ShortText({ displayName: 'Full Name', required: false }),
    bio_raw: Property.LongText({ displayName: 'Bio', required: false }),
    visibility_level: Property.StaticDropdown({
      displayName: 'Visibility',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Everyone', value: 0 },
          { label: 'Logged-in users', value: 1 },
          { label: 'Members and staff', value: 2 },
          { label: 'Staff', value: 3 },
          { label: 'Owners', value: 4 },
        ],
      },
    }),
    usernames: Property.Array({ displayName: 'Initial Members', description: 'Optional usernames to add.', required: false }),
  },
  outputSchema: discourseSchemas.createdGroup,
  async run({ auth, propsValue }) {
    const name = discourseInput.text({ value: propsValue.name, label: 'Name' });
    if (!/^[A-Za-z0-9_.-]{1,60}$/.test(name)) {
      throw new Error('Name may only contain letters, numbers, dots, dashes and underscores.');
    }
    const members = discourseInput.stringList({ value: propsValue.usernames, label: 'Initial Members', required: false });
    const fullName = discourseInput.optionalText(propsValue.full_name);
    const bio = discourseInput.optionalText(propsValue.bio_raw);
    const visibility = discourseInput.boundedNumber({ value: propsValue.visibility_level, label: 'Visibility', min: 0, max: 4, fallback: -1 });
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.POST,
        path: '/admin/groups.json',
        body: {
          group: {
            name,
            ...(fullName === undefined ? {} : { full_name: fullName }),
            ...(bio === undefined ? {} : { bio_raw: bio }),
            ...(visibility < 0 ? {} : { visibility_level: visibility }),
            ...(members.length === 0 ? {} : { usernames: members.join(',') }),
          },
        },
      }),
    );
    return discourseMap.group({ raw: body['basic_group'] ?? body['group'] });
  },
});
