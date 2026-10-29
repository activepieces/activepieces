import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../../common/auth';
import { systemeIoCommon } from '../../common/client';
import { aiListContactFieldsOutputSchema } from '../../output-schemas-ai';

export const systemeListContactFields = createAction({
  auth: systemeIoAuth,
  name: 'systeme_list_contact_fields',
  classification: 'SEARCH',
  displayName: 'List Contact Fields',
  description: 'List the contact fields defined in the account',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the contact fields defined in the Systeme.io account (slug and display name), such as first_name, surname, phone_number, country and custom fields. Use before systeme_create_contact or systeme_update_contact to get the exact slugs. Returns every field in one response (this list has no paging). Read-only and idempotent.",
    idempotent: true,
  },
  props: {},
  outputSchema: aiListContactFieldsOutputSchema,
  async run(context) {
    const response = await systemeIoCommon.apiCall<{ items?: { slug?: string; fieldName?: string }[]; hasMore?: boolean }>({
      method: HttpMethod.GET,
      url: '/contact_fields',
      auth: context.auth.secret_text,
    });
    const fields = (response?.items ?? []).map((field) => ({ slug: field.slug ?? null, field_name: field.fieldName ?? null }));
    return { fields, count: fields.length, has_more: response?.hasMore === true };
  },
});
