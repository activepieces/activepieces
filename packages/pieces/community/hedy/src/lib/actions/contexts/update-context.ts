import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { SessionContext } from '../../common/types';
import { assertIdPrefix } from '../../common/validation';

export const updateContext = createAction({
  auth: hedyAuth,
  name: 'update-context',
  displayName: 'Update Session Context',
  description: 'Update an existing session context.',
  props: {
    contextId: commonProps.contextId,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the session context (max 200 characters).',
      required: false,
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
    }),
  },
  async run(context) {
    const contextId = assertIdPrefix(
      context.propsValue['contextId'] as string,
      'ctx_',
      'Context ID',
    );
    const client = createClient(context.auth);
    const p = context.propsValue;

    const body: Record<string, unknown> = {};
    if (p['title']) body['title'] = p['title'];
    if (p['content'] !== undefined && p['content'] !== null) body['content'] = p['content'];
    if (p['isDefault'] !== undefined && p['isDefault'] !== null) body['isDefault'] = p['isDefault'];

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided for update.');
    }

    const response = await client.request<SessionContext>({
      method: HttpMethod.PATCH,
      path: `/contexts/${contextId}`,
      body,
    });

    return unwrapResource(response);
  },
});
