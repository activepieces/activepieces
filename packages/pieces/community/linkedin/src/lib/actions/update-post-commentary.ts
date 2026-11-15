import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  buildLinkedinError,
  encodeUrn,
  linkedinCommon,
  santizeText,
} from '../common';
import { linkedinAuth } from '../..';
import { updatePostCommentaryActionOutputSchema } from '../output-schemas';

export const updatePostCommentary = createAction({
  auth: linkedinAuth,
  name: 'update_post_commentary',
  classification: 'WRITE',
  displayName: 'Update Post Commentary',
  description:
    'Edit the commentary, call-to-action label or landing page of an existing LinkedIn post',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits an already published LinkedIn post in place, changing only the fields you supply. Use this to correct a post rather than Delete Post followed by a fresh Create Member Post, which would throw away the existing engagement. At least one field is required, fields left empty keep their current value, and applying the same values again is safe to retry.',
    idempotent: true,
  },
  props: {
    post_urn: Property.ShortText({
      displayName: 'Post URN',
      description:
        'URN of the post to edit, for example urn:li:share:7212345678901234567.',
      required: true,
    }),
    commentary: Property.LongText({
      displayName: 'Commentary',
      description: 'New body text. Leave empty to keep the current text.',
      required: false,
    }),
    content_call_to_action_label: Property.StaticDropdown({
      displayName: 'Call To Action Label',
      description:
        'New call-to-action button label. Leave empty to keep the current one.',
      required: false,
      options: {
        options: [
          { label: 'Apply', value: 'APPLY' },
          { label: 'Download', value: 'DOWNLOAD' },
          { label: 'View Quote', value: 'VIEW_QUOTE' },
          { label: 'Learn More', value: 'LEARN_MORE' },
          { label: 'Sign Up', value: 'SIGN_UP' },
          { label: 'Subscribe', value: 'SUBSCRIBE' },
          { label: 'Register', value: 'REGISTER' },
          { label: 'Join', value: 'JOIN' },
          { label: 'Attend', value: 'ATTEND' },
          { label: 'Request Demo', value: 'REQUEST_DEMO' },
          { label: 'See More', value: 'SEE_MORE' },
        ],
      },
    }),
    content_landing_page: Property.ShortText({
      displayName: 'Landing Page URL',
      description:
        'New destination for the call-to-action button. Leave empty to keep the current one.',
      required: false,
    }),
  },
  outputSchema: updatePostCommentaryActionOutputSchema,

  run: async (context) => {
    const {
      post_urn,
      commentary,
      content_call_to_action_label,
      content_landing_page,
    } = context.propsValue;

    const patch = {
      ...(commentary !== undefined && commentary !== null && commentary !== ''
        ? { commentary: santizeText(commentary) }
        : {}),
      ...(content_call_to_action_label !== undefined &&
      content_call_to_action_label !== null &&
      content_call_to_action_label !== ''
        ? { contentCallToActionLabel: content_call_to_action_label }
        : {}),
      ...(content_landing_page !== undefined &&
      content_landing_page !== null &&
      content_landing_page !== ''
        ? { contentLandingPage: content_landing_page }
        : {}),
    };

    const updatedFields = Object.keys(patch);
    if (updatedFields.length === 0) {
      throw new Error(
        'Nothing to update. Supply at least one of Commentary, Call To Action Label or Landing Page URL.'
      );
    }

    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${linkedinCommon.baseUrl}/rest/posts/${encodeUrn(post_urn)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        headers: {
          ...linkedinCommon.linkedinHeaders,
          'X-RestLi-Method': 'PARTIAL_UPDATE',
        },
        body: {
          patch: {
            $set: patch,
          },
        },
      });

      return {
        success: true,
        post_urn,
        updated_fields: updatedFields.join(', '),
        updated_field_count: updatedFields.length,
      };
    } catch (error) {
      throw buildLinkedinError({ error, resource: `the post ${post_urn}` });
    }
  },
});
