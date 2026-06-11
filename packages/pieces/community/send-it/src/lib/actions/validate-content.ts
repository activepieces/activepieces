import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import {
  platformProperty,
  textProperty,
  mediaUrlProperty,
  mediaUrlsProperty,
  mediaTypeProperty,
  sendItRequest,
} from '../common';

export const validateContent = createAction({
  auth: sendItAuth,
  name: 'validate_content',
  displayName: 'Validate Content',
  description: 'Check if content meets platform requirements before publishing',
  audience: 'both',
  aiMetadata: {
    description:
      'Validates that a post (text plus optional media) meets the requirements of the selected social platforms, such as character limits and media rules, without publishing anything. Use this as a pre-flight check before Publish Post or Schedule Post. Idempotent: it is a read-only check with no side effects.',
    idempotent: true,
  },
  props: {
    platforms: platformProperty,
    text: textProperty,
    mediaUrl: mediaUrlProperty,
    mediaUrls: mediaUrlsProperty,
    mediaType: mediaTypeProperty,
  },
  async run(context) {
    const { platforms, text, mediaUrl, mediaUrls, mediaType } =
      context.propsValue;

    return await sendItRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/validate',
      {
        platforms,
        content: {
          text,
          mediaUrl,
          mediaUrls,
          mediaType,
        },
      }
    );
  },
});
