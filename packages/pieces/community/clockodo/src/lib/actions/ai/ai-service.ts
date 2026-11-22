import { Property, createAction } from '@activepieces/pieces-framework';
import { deletedResult, makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

export const aiGetService = createAction({
  auth: clockodoAuth,
  name: 'ai_get_service',
  classification: 'READ',
  displayName: 'Get Service',
  description: 'Retrieves a single service from Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.service,
  aiMetadata: {
    description: 'Returns one Clockodo service (activity type) by its numeric service id (find ids with Get Services). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    service_id: clockodoAiProps.id({ displayName: 'Service ID', source: 'Get Services', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service ID' });
    return makeClient(auth.props).getService(id);
  },
});

export const aiUpdateService = createAction({
  auth: clockodoAuth,
  name: 'ai_update_service',
  classification: 'WRITE',
  displayName: 'Update Service',
  description: 'Updates a service in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.service,
  aiMetadata: {
    description:
      'Changes only the fields you give on a Clockodo service identified by its numeric service id. Active takes "yes"/"no". Idempotent.',
    idempotent: true,
  },
  props: {
    service_id: clockodoAiProps.id({ displayName: 'Service ID', source: 'Get Services', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    number: Property.ShortText({ displayName: 'Number', required: false }),
    active: clockodoAiProps.yesNo({ displayName: 'Active', description: 'Whether the service is active.' }),
    note: Property.LongText({ displayName: 'Note', placeholder: 'e.g. Agreed by phone', required: false }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service ID' });
    return makeClient(auth.props).updateService({
      id,
      request: clockodoRequests.compact({
        name: propsValue.name || undefined,
        number: clockodoRequests.optionalText(propsValue.number),
        active: clockodoRequests.parseYesNo({ value: propsValue.active, field: 'Active' }),
        note: clockodoRequests.optionalText(propsValue.note),
      }),
    });
  },
});

export const aiDeleteService = createAction({
  auth: clockodoAuth,
  name: 'ai_delete_service',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Service',
  description: 'Deletes a service in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo service by its numeric service id. The service must be inactive first (Update Service with active "no"). Not idempotent: a second call for the same id fails because the service is gone.',
    idempotent: false,
  },
  props: {
    service_id: clockodoAiProps.id({ displayName: 'Service ID', source: 'Get Services', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service ID' });
    await makeClient(auth.props).deleteService(id);
    return deletedResult(id);
  },
});
