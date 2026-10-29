import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../../common/auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { sendItOutputSchemas } from '../../common/output-schemas';
import { sendItRequests } from '../../common/requests';

export const getPlatformRequirements = createAction({
  auth: sendItAuth,
  name: 'get_platform_requirements',
  classification: 'READ',
  displayName: 'Get Platform Requirements',
  description: 'Gets the text limit and media rules for one platform.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the posting rules for one platform before writing a post: textLimit, image formats and max size, max images, video formats, max duration and size, rate limit and notes. Unknown platforms fail with SendIt\'s list of valid values. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    platform: aiProps.platform(),
  },
  outputSchema: sendItOutputSchemas.requirements,
  async run(context) {
    return sendItRequests.requirements({ apiKey: apiKeyOf(context.auth), platform: context.propsValue.platform });
  },
});
