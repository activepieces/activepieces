import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const updateLead = createAction({
  auth: closeAuth,
  name: 'update_lead',
  classification: 'WRITE',
  displayName: 'Update Lead',
  description: 'Change the name, status, website, description or custom fields of a lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates fields on an existing Close lead by lead id (lead_...). Only the fields you pass change; others are left as they are. An empty string clears Description or Website. Status takes a stat_ id from List Lead Statuses. Custom fields take cf_ ids from List Custom Fields; a null value clears that field. Contacts are not changed here; use Update Contact. Returns the updated lead.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.lead,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', description: 'lead_...', required: true }),
    name: Property.ShortText({ displayName: 'Lead Name', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'Pass an empty string to clear it.', required: false }),
    url: Property.ShortText({ displayName: 'Website', description: 'Pass an empty string to clear it.', required: false }),
    statusId: Property.ShortText({ displayName: 'Lead Status ID', description: 'stat_... from List Lead Statuses.', required: false }),
    customFields: Property.Json({ displayName: 'Custom Fields', description: 'Object of cf_... id to value; null clears a field.', required: false }),
  },
  async run({ auth, propsValue }) {
    const leadId = closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' });
    const body: Record<string, unknown> = { ...closeClient.customFieldsBody({ value: propsValue.customFields }) };
    const name = closeClient.optionalText(propsValue.name);
    const description = closeClient.clearableText(propsValue.description);
    const url = closeClient.clearableText(propsValue.url);
    const statusId = closeClient.optionalCloseId({ value: propsValue.statusId, label: 'Lead Status ID', prefix: 'stat' });
    if (name !== undefined) body['name'] = name;
    if (description !== undefined) body['description'] = description;
    if (url !== undefined) body['url'] = url;
    if (statusId !== undefined) body['status_id'] = statusId;
    if (Object.keys(body).length === 0) throw new Error('Pass at least one field to update.');
    const updated = await closeClient.request({ auth, method: HttpMethod.PUT, path: `/lead/${closeClient.pathId(leadId)}/`, body });
    return closeMappers.lead(updated);
  },
});

export { updateLead };
