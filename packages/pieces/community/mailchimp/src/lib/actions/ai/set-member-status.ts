import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../../..';
import { mailchimpApi, ApiMember } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const setMemberStatusAi = createAction({
  auth: mailchimpAuth,
  name: 'set_member_status',
  classification: 'WRITE',
  displayName: 'Set Member Status',
  description: 'Subscribe, unsubscribe or re-confirm an existing audience member.',
  audience: 'ai',
  aiMetadata: {
    description: 'Sets the subscription status of an existing member (list_id + email) to subscribed, unsubscribed or pending. Fails if the email is not in the audience (create it with Upsert Member). "pending" makes Mailchimp send a double opt-in confirmation email. Only subscribe people who gave consent. Idempotent: the same status converges to the same state.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['aiMemberWrite'],
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
    status: Property.StaticDropdown<string>({
      displayName: 'Status',
      description: 'subscribed, unsubscribed or pending.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Pending (sends a confirmation email)', value: 'pending' },
        ],
      },
    }),
  },
  async run(context) {
    const status = mailchimpApi.requireText({ value: context.propsValue.status, label: 'Status' });
    if (!['subscribed', 'unsubscribed', 'pending'].includes(status)) {
      throw new Error('Status must be subscribed, unsubscribed or pending.');
    }
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = mailchimpApi.memberPath({ listId, email });
    const member = await client.request<ApiMember>({
      method: HttpMethod.PATCH,
      path,
      body: { status },
      operation: 'set member status',
    });
    return toWriteResult({ member, tagsApplied: [] });
  },
});

function toWriteResult({ member, tagsApplied }: { member: ApiMember; tagsApplied: string[] }) {
  return {
    id: member.id,
    email: member.email_address,
    status: member.status,
    list_id: member.list_id,
    last_changed: member.last_changed || null,
    tags_applied: tagsApplied,
  };
}
