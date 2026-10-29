import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

function sequence(raw: unknown) {
  const s = closeMappers.recordOf(raw);
  const steps = closeMappers.arrayOf(s['steps']).map((step) => {
    const r = closeMappers.recordOf(step);
    return {
      id: closeMappers.str(r['id']),
      stepType: closeMappers.str(r['step_type']),
      delaySeconds: closeMappers.num(r['delay']),
      emailTemplateId: closeMappers.str(r['email_template_id']),
    };
  });
  return {
    id: closeMappers.str(s['id']),
    name: closeMappers.str(s['name']),
    status: closeMappers.str(s['status']),
    timezone: closeMappers.str(s['timezone']),
    stepCount: steps.length,
    steps,
    dateCreated: closeMappers.str(s['date_created']),
    dateUpdated: closeMappers.str(s['date_updated']),
  };
}

export const listSequences = createAction({
  auth: closeAuth,
  name: 'list_sequences',
  classification: 'SEARCH',
  displayName: 'List Sequences',
  description: 'List email/call sequences (workflows).',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Close sequences (workflows) with id (seq_...), name, status (active/paused), timezone and their steps (type email/call, delay in seconds, email template id). Use the id with Subscribe Contact to Sequence. Paged with limit (1-100) and skip (use nextSkip). Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.offsetPage({
    itemsLabel: 'Sequences',
    labelKey: 'name',
    items: [
      { key: 'id', label: 'Sequence ID' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'timezone', label: 'Timezone' },
      { key: 'stepCount', label: 'Steps', format: 'number' },
      {
        key: 'steps',
        label: 'Step Details',
        labelKey: 'stepType',
        listItems: [
          { key: 'id', label: 'Step ID' },
          { key: 'stepType', label: 'Type' },
          { key: 'delaySeconds', label: 'Delay (s)', format: 'number' },
          { key: 'emailTemplateId', label: 'Email Template ID' },
        ],
      },
      { key: 'dateCreated', label: 'Created', format: 'datetime' },
      { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
    ],
  }),
  props: {
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 100', required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Use nextSkip from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 });
    const skip = closeClient.parseInteger({ value: propsValue.skip, label: 'Skip', min: 0, max: 1_000_000 });
    const page = await closeClient.listPage({ auth, path: '/sequence/', limit, skip });
    return closeMappers.offsetPage({ ...page, map: sequence });
  },
});
