import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchContactsAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_contacts',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Search contacts saved in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches contacts saved in your Apollo CRM by keywords (name, title, company, email), contact stage IDs and list IDs, sorted and paged. To look up one contact by exact email prefer Find Contact by Email; to find net-new people use Search People. Uses no credits; needs a paid Apollo plan.',
    idempotent: true,
  },
  props: {
    keywords: aiProps.text({ displayName: 'Keywords', description: 'Words matched against name, title, company and email.', required: false }),
    contact_stage_ids: aiProps.textList({ displayName: 'Contact Stage IDs', description: 'Stage IDs from List Contact Stages (field id).', required: false }),
    list_ids: aiProps.textList({ displayName: 'List IDs', description: 'Contact list IDs from List Lists (field id).', required: false }),
    sort_by: aiProps.choice({
      displayName: 'Sort By',
      description: 'Sort field (default: last activity).',
      required: false,
      options: [
        { label: 'Last activity', value: 'contact_last_activity_date' },
        { label: 'Created at', value: 'contact_created_at' },
        { label: 'Updated at', value: 'contact_updated_at' },
        { label: 'Email last opened', value: 'contact_email_last_opened_at' },
        { label: 'Email last clicked', value: 'contact_email_last_clicked_at' },
      ],
    }),
    sort_ascending: aiProps.yesNo({ displayName: 'Oldest First', description: 'yes sorts ascending; default no (newest first).' }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.contactSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const stageIds = apolloInputs.stringList(propsValue.contact_stage_ids);
    const listIds = apolloInputs.stringList(propsValue.list_ids);
    const sortBy = apolloInputs.optionalText(propsValue.sort_by);
    const body = await apolloRequests.searchContacts({
      apiKey: apiKeyOf(auth),
      body: apolloInputs.compact({
        q_keywords: apolloInputs.optionalText(propsValue.keywords),
        contact_stage_ids: stageIds.length > 0 ? stageIds : undefined,
        contact_label_ids: listIds.length > 0 ? listIds : undefined,
        sort_by_field: sortBy,
        sort_ascending: sortBy === undefined ? undefined : apolloInputs.yesNoValue(propsValue.sort_ascending) === true,
        page,
        per_page: perPage,
      }),
    });
    const contacts = recordsOf(body['contacts']).map((contact) => apolloMappers.contact(contact));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: contacts.length }), contacts };
  },
});
