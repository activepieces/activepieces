import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newCompanyCreated = createTrigger({
  auth: biginAuth,
  name: 'newCompanyCreated',
  displayName: 'New Company Created',
  description: 'Triggers when a new company record is created',
  aiMetadata: {
    description:
      'Fires when a new company (account) record is created in Bigin CRM, via an Accounts.create webhook. Represents a newly added organization. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Accounts', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Accounts', event: 'create', storeKey: 'bigin_new_company_created_trigger' }),
});
