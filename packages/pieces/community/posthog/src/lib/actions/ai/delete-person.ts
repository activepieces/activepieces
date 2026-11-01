import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const deletePerson = createAction({
  auth: posthogAuth,
  name: 'delete_person',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Person',
  description: 'Permanently delete a person (and optionally their events).',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes a PostHog person by person UUID (the id from Get Person, not a distinct ID). deleteEvents=true also queues deletion of all their events (GDPR erasure; runs in the background, cannot be undone). New events with the same distinct ID will create a new person. Cannot be undone. Deleting an already-deleted person returns a not-found error.',
    idempotent: false,
  },
  outputSchema: posthogOutputSchemas.deleted,
  props: {
    personId: Property.ShortText({ displayName: 'Person ID (UUID)', required: true }),
    deleteEvents: Property.Checkbox({ displayName: 'Also Delete Events', required: false, defaultValue: false }),
  },
  async run({ auth, propsValue }) {
    const personId = posthogClient.uuid({ value: propsValue.personId, label: 'Person ID' });
    if (personId === undefined) throw new Error('Person ID is required.');
    const deleteEvents = posthogClient.parseBoolean({ value: propsValue.deleteEvents, label: 'Also Delete Events' }) === true;
    await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.DELETE,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['persons', personId] }),
      query: deleteEvents ? { delete_events: 'true' } : undefined,
    });
    return { id: personId, deleted: true };
  },
});
