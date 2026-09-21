import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { deleteContactPhotoOutputSchema } from '../output-schemas';

export const googleContactsDeleteContactPhotoAction = createAction({
  auth: googleContactsAuth,
  name: 'delete_contact_photo',
  classification: 'WRITE',
  displayName: 'Delete Contact Photo',
  description: 'Remove the photo of an existing contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the photo from one Google Contacts person, leaving the rest of the contact untouched. Supply the opaque resourceName from List Contacts or Search Contacts; use Update Contact Photo to set a new image instead. The removed image is not recoverable through this API.',
    idempotent: false,
  },
  outputSchema: deleteContactPhotoOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact resource name such as people/c12345. Resolve it with List Contacts or Search Contacts.',
      required: true,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    let response: Record<string, unknown>;
    try {
      response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        path: `/${resourceName}:deleteContactPhoto`,
        queryParams: {
          personFields: googleContactsApi.contactReadMask.join(','),
        },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Delete Contact Photo',
      });
    }
    // People wraps the refreshed contact as `{ person: {...} }` here; unwrap it so this step
    // returns a bare Person like every other person-returning action in the piece.
    const person = googleContactsApi.readRecord({
      source: response,
      path: ['person'],
    });
    if (person === undefined) {
      throw new Error(
        'Delete Contact Photo could not read the updated contact back from Google Contacts; re-read the contact with Get Contact to confirm the photo was removed.'
      );
    }
    return person;
  },
});
