import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const companyUpdated = createTrigger({
  auth: biginAuth,
  name: 'companyUpdated',
  displayName: 'Company Updated',
  description: 'Triggers when a company record is updated. Full records are fetched for the first 10 IDs.',
  aiMetadata: {
    description:
      'Fires when an existing company (account) record is edited in Bigin CRM, via an Accounts.edit webhook. Represents a change to an organization already in the CRM. The output includes every notified record id (ids) and the full records of the first 10 ids only (records); a bulk change can notify more ids than that, so use ids for the complete list. If a record read fails, records holds the ones fetched so far and records_error says why.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Accounts', event: 'edit' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Accounts', event: 'edit', storeKey: 'bigin_company_updated_trigger' }),
});
