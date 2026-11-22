import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const getMemberTags = createAction({
  auth: mailchimpAuth,
  name: 'get_member_tags',
  classification: 'READ',
  displayName: 'Get Member Tags',
  description: 'Get every tag applied to an audience member.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns every tag currently applied to one member, identified by list_id and email, with tag ID, name and when it was added. Fails if the member is not in the audience. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['memberTags'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the audience member.',
      required: true,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email Address' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const tags = await client.listAll<MemberTag>({
      path: `${mailchimpApi.memberPath({ listId, email })}/tags`,
      itemsKey: 'tags',
      operation: 'get member tags',
    });
    return {
      tags: tags.map((tag) => ({ id: tag.id, name: tag.name, date_added: tag.date_added ?? null })),
      total_items: tags.length,
    };
  },
});

type MemberTag = { id: number; name: string; date_added?: string };
