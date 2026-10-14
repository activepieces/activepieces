import { Property, createAction } from '@activepieces/pieces-framework';
import {
  buildLinkedinError,
  linkedinCommon,
  publishMemberPost,
} from '../common';
import { linkedinAuth } from '../..';
import { createMemberPostActionOutputSchema } from '../output-schemas';

export const createMemberPost = createAction({
  auth: linkedinAuth,
  name: 'create_member_post',
  classification: 'WRITE',
  displayName: 'Create Member Post',
  description:
    "Publish a post on the connected LinkedIn member's personal profile",
  audience: 'ai',
  aiMetadata: {
    description:
      "Publishes a post to the connected LinkedIn member's own profile and returns the created post URN. This is the only way to publish from this piece: posts always appear as the member who authorized the connection, and publishing as a company page is not available. Not idempotent — every call creates a new post, so a retry publishes a duplicate.",
    idempotent: false,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'Body of the post.',
      required: true,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Who can see the post.',
      required: true,
      defaultValue: 'PUBLIC',
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Connections Only', value: 'CONNECTIONS' },
        ],
      },
    }),
    link: Property.ShortText({
      displayName: 'Link URL',
      description: 'Optional URL to attach as an article preview.',
      required: false,
    }),
    link_title: Property.ShortText({
      displayName: 'Link Title',
      required: false,
    }),
    link_description: Property.ShortText({
      displayName: 'Link Description',
      required: false,
    }),
    image: linkedinCommon.imageUrl,
    image_urn: Property.ShortText({
      displayName: 'Image URN',
      description:
        'URN of an image already uploaded to LinkedIn, for example urn:li:image:D4E10AQ.... Obtain it from Create Image Upload URL and PUT the bytes to that upload URL before posting.',
      required: false,
    }),
  },
  outputSchema: createMemberPostActionOutputSchema,

  run: async (context) => {
    const {
      text,
      visibility,
      link,
      link_title,
      link_description,
      image,
      image_urn,
    } = context.propsValue;

    try {
      return await publishMemberPost({
        accessToken: context.auth.access_token,
        idToken: context.auth.data.id_token,
        text,
        visibility,
        imageFile: image,
        imageUrn: image_urn,
        link,
        linkTitle: link_title,
        linkDescription: link_description,
      });
    } catch (error) {
      throw buildLinkedinError({
        error,
        resource: 'the authenticated member profile',
      });
    }
  },
});
