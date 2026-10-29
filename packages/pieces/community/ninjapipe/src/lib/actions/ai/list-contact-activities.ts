import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiListContactActivities = createAction({
  auth: ninjapipeAuth,
  name: 'ai_list_contact_activities',
  classification: 'SEARCH',
  displayName: 'List Contact Activities',
  description: "Lists a contact's activity timeline.",
  audience: 'ai',
  aiMetadata: {
    description:
      "List a NinjaPipe contact's timeline (notes, tasks, list changes and other events) by contact_id, newest first, optionally only one type such as note or task. Returns one page with items, total, hasMore and nextPage. Read-only.",
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.activityList,
  props: {
    contact_id: ninjapipeAiProps.id({ displayName: 'Contact ID', description: 'Contact UUID from ai_search_contacts.' }),
    type: ninjapipeAiProps.text({ displayName: 'Type', description: 'Only this activity type, e.g. note or task.' }),
    page: ninjapipeAiProps.page(),
    limit: ninjapipeAiProps.limit(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.listPage({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/contacts/${ninjapipeClient.pathId({ value: p.contact_id, field: 'Contact ID' })}/activities`,
      query: { type: p.type },
      page: ninjapipeClient.readPage(p.page),
      limit: ninjapipeClient.clampLimit({ value: p.limit }),
      operation: 'list contact activities',
    });
  },
});
