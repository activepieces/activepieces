import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const listUsersAction = createAction({
  auth: discourseAuth,
  name: 'list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'Lists Discourse users by status, with an optional filter.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List Discourse users in one admin list (active, new, staff, suspended, silenced or staged), optionally filtered by username or email text, 100 per page starting at page 1. Needs an admin key. Emails are included only when Show Emails is on. Read-only.',
    idempotent: true,
  },
  props: {
    flag: Property.StaticDropdown({
      displayName: 'List',
      required: true,
      defaultValue: 'active',
      options: {
        disabled: false,
        options: ['active', 'new', 'staff', 'suspended', 'silenced', 'staged'].map((value) => ({ label: value, value })),
      },
    }),
    filter: Property.ShortText({ displayName: 'Filter', description: 'Text to match in username or email.', required: false }),
    show_emails: Property.Checkbox({ displayName: 'Show Emails', required: false, defaultValue: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number starting at 1.', required: false }),
  },
  outputSchema: discourseSchemas.userList,
  async run({ auth, propsValue }) {
    const flag = FLAGS.includes(String(propsValue.flag)) ? String(propsValue.flag) : undefined;
    if (flag === undefined) {
      throw new Error(`List must be one of ${FLAGS.join(', ')}.`);
    }
    const page = discourseInput.boundedNumber({ value: propsValue.page, label: 'Page', min: 1, max: 10000, fallback: 1 });
    const body = await discourseRequest({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/admin/users/list/${flag}.json`,
      query: {
        filter: discourseInput.optionalText(propsValue.filter),
        show_emails: propsValue.show_emails === true ? 'true' : undefined,
        page,
      },
    });
    const base = discourseOps.baseUrl(auth.props);
    const items = discourseMap.list(body).map((raw) => discourseMap.adminUser({ raw, baseUrl: base }));
    const hasMore = items.length >= PAGE_SIZE;
    return { items, count: items.length, page, next_page: hasMore ? page + 1 : null, has_more: hasMore };
  },
});

const FLAGS = ['active', 'new', 'staff', 'suspended', 'silenced', 'staged'];
const PAGE_SIZE = 100;
