import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { updateContactPhotoOutputSchema } from '../output-schemas';

const base64Marker = 'base64,';

export const googleContactsUpdateContactPhotoAction = createAction({
  auth: googleContactsAuth,
  name: 'update_contact_photo',
  classification: 'WRITE',
  displayName: 'Update Contact Photo',
  description: 'Set the photo of an existing contact from base64 image bytes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replaces the photo of one Google Contacts person with the supplied base64-encoded JPEG, PNG or WebP image. Supply the opaque resourceName from List Contacts or Search Contacts; use Delete Contact Photo to remove a photo instead. Safe to retry — re-sending the same bytes converges on the same photo.',
    idempotent: true,
  },
  outputSchema: updateContactPhotoOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact resource name such as people/c12345. Resolve it with List Contacts or Search Contacts.',
      required: true,
    }),
    photoBytes: Property.LongText({
      displayName: 'Photo Bytes',
      description:
        'Base64-encoded JPEG, PNG or WebP image. A data URL prefix is accepted and stripped.',
      required: true,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    const supplied = context.propsValue.photoBytes.trim();
    const markerIndex = supplied.indexOf(base64Marker);
    const photoBytes =
      markerIndex === -1
        ? supplied
        : supplied.slice(markerIndex + base64Marker.length);
    if (photoBytes.length === 0) {
      throw new Error('Update Contact Photo needs base64-encoded image bytes.');
    }
    let response: Record<string, unknown>;
    try {
      response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.PATCH,
        path: `/${resourceName}:updateContactPhoto`,
        body: {
          photoBytes,
          personFields: googleContactsApi.contactReadMask.join(','),
        },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Update Contact Photo',
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
        'Update Contact Photo could not read the updated contact back from Google Contacts; re-read the contact with Get Contact to confirm the photo was set.'
      );
    }
    return person;
  },
});
