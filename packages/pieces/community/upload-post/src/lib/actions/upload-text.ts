import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uploadPostAuth } from '../auth';
import { uploadPostClient } from '../common/client';
import {
  profileDropdown,
  TEXT_PLATFORMS,
  uploadPostForm,
  uploadPostProps,
} from '../common/props';

export const uploadText = createAction({
  auth: uploadPostAuth,
  name: 'upload_text',
  classification: 'WRITE',
  displayName: 'Upload Text Post',
  description:
    'Publish or schedule a text-only post to LinkedIn, X, Facebook, Threads, Bluesky and more.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publish (or schedule) a text-only post to one or more social platforms connected to an Upload-Post profile, optionally with a link preview. Use Upload Photos or Upload Video when there is media. Each call creates new posts, so retries publish duplicates.',
    idempotent: false,
  },
  props: {
    profile: profileDropdown,
    platforms: uploadPostProps.platforms({
      options: TEXT_PLATFORMS,
      description:
        'Where to publish. Every selected platform must be connected to the chosen profile.',
    }),
    ...uploadPostProps.publishing({
      titleDisplayName: 'Text',
      titleDescription: 'The text of the post.',
      titleRequired: true,
    }),
    link_url: Property.ShortText({
      displayName: 'Link URL',
      description:
        'Optional URL shown as a link preview card on LinkedIn, Bluesky and Facebook.',
      required: false,
    }),
  },
  async run(context) {
    const { profile, platforms, link_url } = context.propsValue;
    const form = uploadPostForm.build({
      profile,
      platforms,
      fields: {
        ...uploadPostForm.commonFields(context.propsValue),
        link_url,
      },
    });
    const response = await uploadPostClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/upload_text',
      body: form,
    });
    return response.body;
  },
});
