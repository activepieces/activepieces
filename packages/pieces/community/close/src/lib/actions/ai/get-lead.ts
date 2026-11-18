import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const getLead = createAction({
  auth: closeAuth,
  name: 'get_lead',
  classification: 'READ',
  displayName: 'Get Lead',
  description: 'Get one lead by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Close lead by lead id (lead_...): name, status, website, description, its contacts with emails and phones, opportunity ids, addresses, custom fields and an app link. Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.lead,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', description: 'lead_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const leadId = closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' });
    const body = await closeClient.request({ auth, method: HttpMethod.GET, path: `/lead/${closeClient.pathId(leadId)}/` });
    return closeMappers.lead(body);
  },
});

export { getLead };
