import { mailchimpOutputSchemas } from '../common/output-schemas';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpApi, MailchimpApiError } from '../common/client';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const unsubscribeEmail = createAction({
  auth: mailchimpAuth,
  name: 'unsubscribe_email',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Email',
  description: 'Unsubscribe an email address from an audience',
  audience: 'human',
  aiMetadata: { description: 'Sets an email address to unsubscribed status within an audience (list) via a batch upsert; with "update existing" on, it changes an existing member, otherwise it can add the address as unsubscribed. Use to opt a contact out of a specific audience. Idempotent: repeating converges to the same unsubscribed state.', idempotent: true },
  outputSchema: mailchimpOutputSchemas['unsubscribeEmail'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to unsubscribe',
      required: true,
    }),
    skip_merge_validation: Property.Checkbox({
      displayName: 'Skip Merge Validation',
      description: 'Accept member data without merge field values even if required',
      required: false,
      defaultValue: false,
    }),
    skip_duplicate_check: Property.Checkbox({
      displayName: 'Skip Duplicate Check',
      description: 'Ignore duplicates in the request',
      required: false,
      defaultValue: false,
    }),
    update_existing: Property.Checkbox({
      displayName: 'Update Existing',
      description: 'Kept for older flows. Existing members are always updated, because Mailchimp rejects the request for existing members otherwise.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email_address, label: 'Email Address' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const result = await client.request<BatchResult>({
      method: HttpMethod.POST,
      path: `/lists/${encodeURIComponent(listId)}`,
      queryParams: {
        skip_merge_validation: context.propsValue.skip_merge_validation ? true : undefined,
        skip_duplicate_check: context.propsValue.skip_duplicate_check ? true : undefined,
      },
      body: {
        members: [{ email_address: email, status: 'unsubscribed' }],
        update_existing: true,
      },
      operation: 'unsubscribe email',
    });
    const errors = result.errors ?? [];
    if (errors.length > 0) {
      const detail = errors
        .map((item) => [item.email_address, item.error_code, item.error].filter((part) => typeof part === 'string' && part.length > 0).join(': '))
        .join('; ');
      throw new MailchimpApiError({
        message: `Mailchimp did not unsubscribe ${email}: ${detail}`,
        status: 400,
        responseBody: { errors },
      });
    }
    return {
      success: true,
      message: `Email ${email} has been unsubscribed`,
      new_members: result.new_members ?? [],
      updated_members: result.updated_members ?? [],
      errors,
      total_created: result.total_created ?? 0,
      total_updated: result.total_updated ?? 0,
      error_count: result.error_count ?? 0,
    };
  },
});

type BatchResult = {
  new_members?: { id: string; email_address: string; status: string }[];
  updated_members?: { id: string; email_address: string; status: string }[];
  errors?: { email_address?: string; error?: string; error_code?: string }[];
  total_created?: number;
  total_updated?: number;
  error_count?: number;
};
