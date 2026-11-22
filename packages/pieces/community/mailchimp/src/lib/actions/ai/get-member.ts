import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../../..';
import { mailchimpApi, ApiMember } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const getMemberAi = createAction({
  auth: mailchimpAuth,
  name: 'get_member',
  classification: 'READ',
  displayName: 'Get Member',
  description: 'Look up one audience member by exact email.',
  audience: 'ai',
  aiMetadata: {
    description: 'Looks up one member by exact email in one audience (list_id). Returns found:false (not an error) when the email is not in that audience, otherwise status, names, tags, merge fields, rating and dates. For partial or cross-audience search use Search Members. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['aiMember'],
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Audience (list) ID, from List Audiences or Resolve Audience.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the member.',
      required: true,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = mailchimpApi.memberPath({ listId, email });
    const member = await client.requestOrNotFound<ApiMember>({
      method: HttpMethod.GET,
      path,
      operation: 'get member',
    });
    if (member === null) {
      await client.request<unknown>({
        method: HttpMethod.GET,
        path: `/lists/${encodeURIComponent(listId)}`,
        queryParams: { fields: 'id' },
        operation: 'get audience',
      });
      return { found: false, email, list_id: listId };
    }
    const summary = mailchimpApi.toMemberSummary(member);
    return {
      found: true,
      id: summary.id,
      email: summary.email_address,
      status: summary.status,
      list_id: summary.list_id,
      first_name: readMerge({ fields: summary.merge_fields, key: 'FNAME' }),
      last_name: readMerge({ fields: summary.merge_fields, key: 'LNAME' }),
      full_name: summary.full_name,
      language: summary.language,
      vip: summary.vip,
      member_rating: summary.member_rating,
      tags: summary.tags.map((tag) => tag.name),
      merge_fields: summary.merge_fields,
      timestamp_signup: summary.timestamp_signup,
      last_changed: summary.last_changed,
    };
  },
});

function readMerge({ fields, key }: { fields: Record<string, unknown>; key: string }): string | null {
  const value = fields[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
