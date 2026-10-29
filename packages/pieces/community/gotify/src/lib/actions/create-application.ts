import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const createApplication = createAction({
  auth: gotifyAuth,
  name: 'create_application',
  classification: 'WRITE',
  displayName: 'Create Application',
  description: 'Create a Gotify application.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Gotify application (name, optional description, optional default priority 0-10) and returns it with its id and its secret app token. Needs the Client Token. Not idempotent: each call creates another application, even with the same name.',
    idempotent: false,
  },
  outputSchema: gotifyOutputSchemas.createdApplication,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    defaultPriority: Property.Number({
      displayName: 'Default Priority',
      description: 'Priority (0-10) used for messages sent without one.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const name = gotifyClient.optionalText(propsValue.name);
    if (name === undefined) {
      throw new Error('Name is required.');
    }
    const defaultPriority = gotifyClient.parseOptionalInt({ value: propsValue.defaultPriority, label: 'Default Priority', min: 0, max: 10 });
    const description = gotifyClient.optionalText(propsValue.description);
    return gotifyClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/application',
      tokenKind: 'client',
      body: {
        name,
        ...(description !== undefined ? { description } : {}),
        ...(defaultPriority !== undefined ? { defaultPriority } : {}),
      },
    });
  },
});
