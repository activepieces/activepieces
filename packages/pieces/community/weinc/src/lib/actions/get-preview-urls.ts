import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { weincRequest } from '../common/client';
import { projectIdDropdown } from '../common/props';

export const getPreviewUrls = createAction({
  auth: weincAuth,
  name: 'get_preview_urls',
  displayName: 'Get Preview URLs',
  description: 'Gets the live site URL (if published), editor URL and embeddable preview URL of a project.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the links for a WeInc project: the live site URL when it is published, the editor URL and an embeddable preview URL. Read-only and idempotent.',
    idempotent: true,
  },
  props: { projectId: projectIdDropdown },
  async run(context) {
    return await weincRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/projects/${encodeURIComponent(context.propsValue.projectId)}/preview`,
    });
  },
});
