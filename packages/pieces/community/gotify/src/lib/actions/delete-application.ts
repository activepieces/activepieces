import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { GotifyApiError, gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const deleteApplication = createAction({
  auth: gotifyAuth,
  name: 'delete_application',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Application',
  description: 'Delete an application and all of its messages.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a Gotify application by numeric id, together with all its messages; its app token stops working. Needs the Client Token. A repeat call on an application that no longer exists returns deleted=false, alreadyDeleted=true instead of failing.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.deleteApplication,
  props: {
    applicationId: Property.ShortText({ displayName: 'Application ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = gotifyClient.parseId({ value: propsValue.applicationId, label: 'Application ID' });
    try {
      await gotifyClient.request({ auth: auth.props, method: HttpMethod.DELETE, path: `/application/${id}`, tokenKind: 'client' });
      return { id, deleted: true, alreadyDeleted: false };
    } catch (error) {
      if (error instanceof GotifyApiError && error.status === 404) {
        return { id, deleted: false, alreadyDeleted: true };
      }
      throw error;
    }
  },
});
