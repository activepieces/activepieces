import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { flattenObject } from '../common';
import { youtrackClient } from '../common/client';
import { createTagActionOutputSchema } from '../output-schemas';

export const createTagAction = createAction({
  auth: youtrackAuth,
  name: 'create_tag',
  classification: 'WRITE',
  outputSchema: createTagActionOutputSchema,
  displayName: 'Create Tag',
  description: 'Creates a new tag in YouTrack.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new tag in YouTrack with a given name, optionally set to auto-remove when an issue is resolved. Use to define a label before applying it with Add Tag to Issue; check List Tags first to avoid duplicates. Not idempotent: a tag name must be unique, so repeating the call with the same name fails (HTTP 400 "Property Tag.name is invalid").',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Tag Name', description: 'Name like "Regression" or "To deploy".', required: true }),
    untagOnResolve: Property.Checkbox({ displayName: 'Remove when resolved?', required: false, defaultValue: false }),
  },
  async run(context) {
    const body: Record<string, unknown> = { name: context.propsValue.name };
    if (context.propsValue.untagOnResolve !== undefined) body['untagOnResolve'] = context.propsValue.untagOnResolve;
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/tags',
      query: { fields: 'id,name,owner(id,name),untagOnResolve' },
      body,
      operation: 'create the tag',
    });
    return flattenObject({ obj: youtrackClient.recordOf(response) });
  },
});
