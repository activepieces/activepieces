import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const mergeLeads = createAction({
  auth: closeAuth,
  name: 'merge_leads',
  classification: 'DESTRUCTIVE',
  displayName: 'Merge Leads',
  description: 'Merge a duplicate lead into another lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Merges a duplicate Close lead (source, lead_...) into another lead (destination, lead_...). Contacts, opportunities, tasks and activities move to the destination and the source lead is deleted; this cannot be undone. Returns the destination lead after the merge. Repeating it fails because the source no longer exists.',
    idempotent: false,
  },
  outputSchema: {
    fields: [{ key: 'mergedSourceId', label: 'Merged Source Lead ID' }, ...closeOutputSchemas.fields.lead],
  },
  props: {
    sourceLeadId: Property.ShortText({ displayName: 'Source Lead ID', description: 'lead_... to merge away (it is deleted).', required: true }),
    destinationLeadId: Property.ShortText({ displayName: 'Destination Lead ID', description: 'lead_... that is kept.', required: true }),
  },
  async run({ auth, propsValue }) {
    const source = closeClient.closeId({ value: propsValue.sourceLeadId, label: 'Source Lead ID', prefix: 'lead' });
    const destination = closeClient.closeId({ value: propsValue.destinationLeadId, label: 'Destination Lead ID', prefix: 'lead' });
    if (source === destination) throw new Error('Source and destination must be different leads.');
    await closeClient.request({ auth, method: HttpMethod.POST, path: '/lead/merge/', body: { source, destination } });
    const merged = await closeClient.request({ auth, method: HttpMethod.GET, path: `/lead/${closeClient.pathId(destination)}/` });
    return { mergedSourceId: source, ...closeMappers.lead(merged) };
  },
});

export { mergeLeads };
