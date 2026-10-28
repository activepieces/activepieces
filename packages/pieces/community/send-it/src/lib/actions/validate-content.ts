import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import { mediaTypeProperty, mediaUrlProperty, mediaUrlsProperty, platformProperty, textProperty } from '../common/props';
import { sendItRequests } from '../common/requests';

export const validateContent = createAction({
  auth: sendItAuth,
  name: 'validate_content',
  classification: 'READ',
  displayName: 'Validate Content',
  description: 'Check if content meets platform requirements before publishing',
  audience: 'both',
  aiMetadata: {
    description:
      'Checks a post (text plus optional media) against the selected platforms without publishing anything. Returns valid (boolean), errors and warnings per platform (e.g. "Instagram requires media"), and platformLimits per platform (text limit, media required, max images). Use before Publish Post or Schedule Post. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    platforms: platformProperty,
    text: textProperty,
    mediaUrl: mediaUrlProperty,
    mediaUrls: mediaUrlsProperty,
    mediaType: mediaTypeProperty,
  },
  outputSchema: sendItOutputSchemas.validationResult,
  async run(context) {
    const { platforms, text, mediaUrl, mediaUrls, mediaType } = context.propsValue;
    return sendItRequests.validate({ apiKey: apiKeyOf(context.auth), input: { platforms, text, mediaUrl, mediaUrls, mediaType } });
  },
});
