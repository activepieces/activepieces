import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const deletedPropertyOutputSchema = {
  fields: [
    { key: 'personId', label: 'Person ID' },
    { key: 'property', label: 'Removed Property' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
} satisfies OutputSchema;

export const deletePersonProperty = createAction({
  auth: posthogAuth,
  name: 'delete_person_property',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Person Property',
  description: 'Remove one property from a person.',
  audience: 'ai',
  aiMetadata: {
    description: 'Removes one property (by exact key, e.g. "plan") from a PostHog person, identified by person UUID (the id from Get Person, not a distinct ID). Applied asynchronously (seconds). Removing a property the person does not have succeeds and changes nothing, so repeating the call is safe. To remove several properties by distinct ID use Update Person Properties with unset instead.',
    idempotent: true,
  },
  outputSchema: deletedPropertyOutputSchema,
  props: {
    personId: Property.ShortText({ displayName: 'Person ID (UUID)', required: true }),
    property: Property.ShortText({ displayName: 'Property Key', required: true }),
  },
  async run({ auth, propsValue }) {
    const personId = posthogClient.uuid({ value: propsValue.personId, label: 'Person ID' });
    if (personId === undefined) throw new Error('Person ID is required.');
    const property = posthogClient.requiredText({ value: propsValue.property, label: 'Property Key' });
    await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['persons', personId, 'delete_property'] }),
      body: { $unset: property },
    });
    return { personId, property, deleted: true };
  },
});
