import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../common/auth';
import { equalsFilter, joinFilters, klaviyoApi } from '../../common/client';
import { normalizePhone } from '../../common/props';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const listProfilesAi = createAction({
  auth: klaviyoAuth,
  name: 'list_profiles_ai',
  classification: 'SEARCH',
  displayName: 'List Profiles',
  description: 'List Klaviyo profiles with optional filters, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Klaviyo profiles one page at a time, optionally filtered by exact email, phone number or external ID, or by created/updated after a date-time. Use to browse or find profiles; for a single exact email or phone lookup Find Profile by Email/Phone is simpler. With a created_after or updated_after filter, sort must be empty or that same field ascending, and with both filters sort must be empty. Pass next_cursor back as cursor for the next page. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiProfilePage,
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Exact email to match.', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone Number', description: 'Exact E.164 phone number to match, e.g. +15005550006.', required: false }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Exact external ID to match.', required: false }),
    created_after: Property.ShortText({ displayName: 'Created After', description: 'ISO 8601 date-time with timezone, e.g. 2026-01-15T10:00:00Z.', required: false }),
    updated_after: Property.ShortText({ displayName: 'Updated After', description: 'ISO 8601 date-time with timezone.', required: false }),
    sort: Property.StaticDropdown<string>({
      displayName: 'Sort',
      description: 'Order of results. Omit for Klaviyo default order. With Created After, only "Created (oldest first)" is allowed; with Updated After, only "Updated (oldest first)"; with both, leave it empty.',
      required: false,
      options: {
        options: [
          { label: 'Created (oldest first)', value: 'created' },
          { label: 'Created (newest first)', value: '-created' },
          { label: 'Updated (oldest first)', value: 'updated' },
          { label: 'Updated (newest first)', value: '-updated' },
        ],
      },
    }),
    page_size: klaviyoInputs.pageSizeProp({ max: 100, defaultValue: 20 }),
    cursor: klaviyoInputs.cursorProp(),
  },
  async run({ auth, propsValue }) {
    const email = klaviyoInputs.optionalText(propsValue.email);
    const phone = klaviyoInputs.optionalText(propsValue.phone_number);
    const externalId = klaviyoInputs.optionalText(propsValue.external_id);
    const createdAfter = klaviyoInputs.isoDateTime({ value: propsValue.created_after, label: 'Created After' });
    const updatedAfter = klaviyoInputs.isoDateTime({ value: propsValue.updated_after, label: 'Updated After' });
    const sort = klaviyoInputs.oneOf({ value: propsValue.sort, label: 'Sort', allowed: ['created', '-created', 'updated', '-updated'] });
    checkSort({ sort, createdAfter, updatedAfter });
    const filter = joinFilters([
      email === undefined ? undefined : equalsFilter({ field: 'email', value: email }),
      phone === undefined ? undefined : equalsFilter({ field: 'phone_number', value: normalizePhone(phone) }),
      externalId === undefined ? undefined : equalsFilter({ field: 'external_id', value: externalId }),
      createdAfter === undefined ? undefined : `greater-than(created,${createdAfter})`,
      updatedAfter === undefined ? undefined : `greater-than(updated,${updatedAfter})`,
    ]);
    const page = await klaviyoApi.listPage({
      auth,
      path: '/profiles',
      query: {
        filter,
        sort,
        'page[size]': klaviyoInputs.pageSize({ value: propsValue.page_size, max: 100, defaultValue: 20 }),
      },
      cursor: klaviyoInputs.optionalText(propsValue.cursor),
    });
    return klaviyoInputs.pageOutput({ page, map: klaviyoInputs.flatProfile });
  },
});

function checkSort({ sort, createdAfter, updatedAfter }: { sort: string | undefined; createdAfter: string | undefined; updatedAfter: string | undefined }): void {
  if (sort === undefined) {
    return;
  }
  if (createdAfter !== undefined && updatedAfter !== undefined) {
    throw new Error('Leave Sort empty when both Created After and Updated After are set: Klaviyo only allows sorting by the filtered date field.');
  }
  if (createdAfter !== undefined && sort !== 'created') {
    throw new Error('With Created After, Sort must be empty or "created" (oldest first): Klaviyo only allows sorting ascending by the filtered date field.');
  }
  if (updatedAfter !== undefined && sort !== 'updated') {
    throw new Error('With Updated After, Sort must be empty or "updated" (oldest first): Klaviyo only allows sorting ascending by the filtered date field.');
  }
}
