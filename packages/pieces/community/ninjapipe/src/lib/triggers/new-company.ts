import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../auth';
import { ninjapipeSchemas } from '../output-schemas';
import { ninjapipePolling } from './common';

const polling = ninjapipePolling.buildPolling({ path: '/companies', field: 'created_at' });

export const newCompany = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_company',
  classification: 'READ',
  displayName: 'New Company',
  description: 'Triggers when a company is created.',
  aiMetadata: {
    description:
      'Fires once for each newly created NinjaPipe company, found by polling companies sorted by created_at. The payload is the company record: id, name, domain, email, phone, website, industry, status, owner_id, fields and timestamps.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: ninjapipeSchemas.company,
  sampleData: {
    id: '43e794a1-fbc0-4167-b881-c2c568d30a51',
    name: 'Acme GmbH',
    domain: 'acme.example',
    email: 'info@acme.example',
    phone: '+4930123456',
    website: 'https://acme.example',
    industry: 'Software',
    status: 'Active',
    owner_id: '01a55c1c-96af-4a4f-879b-e317def0769a',
    is_archived: false,
    slug: 'acme-gmbh',
    fields: {},
    created_at: '2026-10-25T15:33:57.944899+00:00',
    updated_at: '2026-10-25T15:33:57.944899+00:00',
  },
  props: {},
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
