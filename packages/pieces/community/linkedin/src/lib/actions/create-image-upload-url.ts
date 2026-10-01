import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  buildLinkedinError,
  getMemberUrn,
  linkedinCommon,
} from '../common';
import { linkedinAuth } from '../..';
import { createImageUploadUrlActionOutputSchema } from '../output-schemas';

export const createImageUploadUrl = createAction({
  auth: linkedinAuth,
  name: 'create_image_upload_url',
  classification: 'WRITE',
  displayName: 'Create Image Upload URL',
  description: 'Reserve a LinkedIn image URN and a URL to upload the bytes to',
  audience: 'ai',
  aiMetadata: {
    description:
      'Registers a new LinkedIn image and reserves a short-lived URL to upload its bytes to. This is step one of two: PUT the raw image bytes to the returned upload URL, then pass the returned image URN as the Image URN of Create Member Post. The URL expires, so reserve it immediately before uploading, and note it is not idempotent because each call reserves a new image.',
    idempotent: false,
  },
  props: {
    owner_urn: Property.ShortText({
      displayName: 'Owner URN',
      description:
        'Who will own the image. Defaults to the connected member.',
      required: false,
    }),
  },
  outputSchema: createImageUploadUrlActionOutputSchema,

  run: async (context) => {
    const ownerInput = context.propsValue.owner_urn;
    const owner =
      ownerInput && ownerInput.length > 0
        ? ownerInput
        : getMemberUrn(context.auth.data.id_token);

    try {
      const response = await httpClient.sendRequest<InitializeUploadResponse>({
        method: HttpMethod.POST,
        url: `${linkedinCommon.baseUrl}/rest/images`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        headers: { ...linkedinCommon.linkedinHeaders },
        queryParams: {
          action: 'initializeUpload',
        },
        body: {
          initializeUploadRequest: {
            owner,
          },
        },
      });

      const value = response.body.value;
      return {
        owner_urn: owner,
        image_urn: value?.image ?? null,
        upload_url: value?.uploadUrl ?? null,
        upload_url_expires_at: value?.uploadUrlExpiresAt ?? null,
      };
    } catch (error) {
      throw buildLinkedinError({
        error,
        resource: `an image upload for ${owner}`,
      });
    }
  },
});

interface InitializeUploadResponse {
  value?: {
    image?: string;
    uploadUrl?: string;
    uploadUrlExpiresAt?: number;
  };
}
