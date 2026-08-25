import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { SessionContext } from '../../common/types';

export const createContext = createAction({
  auth: hedyAuth,
  name: 'create-context',
  displayName: 'Create Session Context',
  description: 'Create a new session context with AI instructions.',
  audience: 'both',
  aiMetadata: {
    description: 'Create a new Hedy session context (a reusable set of AI instructions applied to sessions), with a required title plus optional content and a default flag. Not idempotent: each call creates a separate context even with identical input.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the session context (max 200 characters).',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Instructions or context for AI analysis (max 20,000 characters).',
      required: false,
    }),
    isDefault: Property.Checkbox({
      displayName: 'Is Default',
      description: 'Whether this context should be the default for new sessions.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = createClient(context.auth);
    const p = context.propsValue;

    const body: Record<string, unknown> = { title: p['title'] };
    if (p['content']) body['content'] = p['content'];
    if (p['isDefault'] !== undefined) body['isDefault'] = p['isDefault'];

    const response = await client.request<SessionContext>({
      method: HttpMethod.POST,
      path: '/contexts',
      body,
    });

    return unwrapResource(response);
  },
});
