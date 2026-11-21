import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../../..';
import { mailchimpApi, ApiMember } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const upsertMemberAi = createAction({
  auth: mailchimpAuth,
  name: 'upsert_member',
  classification: 'WRITE',
  displayName: 'Upsert Member',
  description: 'Create or update an audience member by email, with optional name, merge fields and tags.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates the member if the email is not in the audience (with status_if_new) or updates name/merge fields if it is; existing status is left alone (use Set Member Status for that). Needs list_id (List Audiences or Resolve Audience). merge_fields_json is a JSON object keyed by merge tag, e.g. {"PHONE":"+1 555"} (tags from List Merge Fields or Resolve Merge Field). Tags are added, never removed. status_if_new "pending" makes Mailchimp send a double opt-in email to new contacts. Idempotent: the same input converges to the same member.',
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
    status_if_new: Property.StaticDropdown<string>({
      displayName: 'Status If New',
      description: 'Status for a new contact: subscribed, unsubscribed, pending or transactional.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Pending (sends a confirmation email)', value: 'pending' },
          { label: 'Transactional', value: 'transactional' },
        ],
      },
    }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    merge_fields_json: Property.LongText({
      displayName: 'Merge Fields JSON',
      description: 'JSON object of merge tag to value, e.g. {"PHONE":"+1 555 0100"}.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tag names to add to the member.',
      required: false,
    }),
  },
  async run(context) {
    const statusIfNew = mailchimpApi.requireText({ value: context.propsValue.status_if_new, label: 'Status If New' });
    if (!STATUSES_IF_NEW.includes(statusIfNew)) {
      throw new Error('Status If New must be subscribed, unsubscribed, pending or transactional.');
    }
    const mergeFields = {
      ...(mailchimpApi.parseJsonObject({ value: context.propsValue.merge_fields_json, label: 'Merge Fields JSON' }) ?? {}),
      ...nameFields({ firstName: context.propsValue.first_name, lastName: context.propsValue.last_name }),
    };
    const tags = mailchimpApi.toStringList(context.propsValue.tags);
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = mailchimpApi.memberPath({ listId, email });
    const member = await client.request<ApiMember>({
      method: HttpMethod.PUT,
      path,
      body: {
        email_address: email,
        status_if_new: statusIfNew,
        ...(Object.keys(mergeFields).length > 0 ? { merge_fields: mergeFields } : {}),
      },
      operation: 'upsert member',
    });
    if (tags.length > 0) {
      await client.request<unknown>({
        method: HttpMethod.POST,
        path: `${path}/tags`,
        body: { tags: tags.map((name) => ({ name, status: 'active' })) },
        operation: 'add tags to member (the member itself was saved)',
      });
    }
    return toWriteResult({ member, tagsApplied: tags });
  },
});

function nameFields({ firstName, lastName }: { firstName: unknown; lastName: unknown }): Record<string, string> {
  const first = mailchimpApi.optionalText(firstName);
  const last = mailchimpApi.optionalText(lastName);
  return {
    ...(first !== undefined ? { FNAME: first } : {}),
    ...(last !== undefined ? { LNAME: last } : {}),
  };
}

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

const STATUSES_IF_NEW = ['subscribed', 'unsubscribed', 'pending', 'transactional'];
