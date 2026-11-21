import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../../..';
import { mailchimpApi, ApiMember } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const updateMemberProfileAi = createAction({
  auth: mailchimpAuth,
  name: 'update_member_profile',
  classification: 'WRITE',
  displayName: 'Update Member Profile',
  description: 'Update the name, merge fields, language or VIP flag of an existing audience member.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates profile data of an existing member (list_id + email): first/last name, merge fields (JSON keyed by merge tag, from List Merge Fields or Resolve Merge Field), language code and VIP flag ("yes"/"no"). Only the fields you give change. It never changes subscription status (use Set Member Status) and fails if the member does not exist (use Upsert Member to create). Idempotent.',
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
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    merge_fields_json: Property.LongText({
      displayName: 'Merge Fields JSON',
      description: 'JSON object of merge tag to value, e.g. {"COMPANY":"Acme"}.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code, e.g. en, fr, es.',
      required: false,
    }),
    vip: Property.StaticDropdown<string>({
      displayName: 'VIP',
      description: 'yes or no. Leave empty to keep the current value.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  async run(context) {
    const mergeFields = {
      ...(mailchimpApi.parseJsonObject({ value: context.propsValue.merge_fields_json, label: 'Merge Fields JSON' }) ?? {}),
      ...nameFields({ firstName: context.propsValue.first_name, lastName: context.propsValue.last_name }),
    };
    const language = mailchimpApi.optionalText(context.propsValue.language);
    const vip = mailchimpApi.optionalText(context.propsValue.vip);
    if (vip !== undefined && vip !== 'yes' && vip !== 'no') {
      throw new Error('VIP must be "yes" or "no".');
    }
    const body = {
      ...(Object.keys(mergeFields).length > 0 ? { merge_fields: mergeFields } : {}),
      ...(language !== undefined ? { language } : {}),
      ...(vip !== undefined ? { vip: vip === 'yes' } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: give a name, merge fields, language or VIP.');
    }
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = mailchimpApi.memberPath({ listId, email });
    const member = await client.request<ApiMember>({
      method: HttpMethod.PATCH,
      path,
      body,
      operation: 'update member profile',
    });
    return toWriteResult({ member, tagsApplied: [] });
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
