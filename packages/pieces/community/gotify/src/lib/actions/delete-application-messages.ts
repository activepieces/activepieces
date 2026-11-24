import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const deleteApplicationMessages = createAction({
  auth: gotifyAuth,
  name: 'delete_application_messages',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Application Messages',
  description: 'Delete all messages of one application.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes every message of one Gotify application, by its numeric application id (from List Applications). The application itself is kept. Needs the Client Token. Fails if the application does not exist; repeating it on an existing application changes nothing more.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.deleteApplicationMessages,
  props: {
    applicationId: Property.ShortText({
      displayName: 'Application ID',
      description: 'Numeric ID of the application whose messages are deleted.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const applicationId = gotifyClient.parseId({ value: propsValue.applicationId, label: 'Application ID' });
    await gotifyClient.request({
      auth: auth.props,
      method: HttpMethod.DELETE,
      path: `/application/${applicationId}/message`,
      tokenKind: 'client',
    });
    return { applicationId, deleted: true };
  },
});
