import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const companyUpdated = createTrigger({
  auth: biginAuth,
  name: 'companyUpdated',
  displayName: 'Company Updated',
  description: 'Triggers when a company record is updated',
  aiMetadata: {
    description:
      'Fires when an existing company (account) record is edited in Bigin CRM, via an Accounts.edit webhook. Represents a change to an organization already in the CRM. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Accounts', event: 'edit' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Accounts', event: 'edit', storeKey: 'bigin_company_updated_trigger' }),
});
