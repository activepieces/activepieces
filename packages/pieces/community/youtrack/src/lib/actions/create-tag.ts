// Action: Create Tag
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { flattenObject } from '../common';

export const createTagAction = createAction({
  auth: youtrackAuth,
  name: 'create_tag',
  displayName: 'Create Tag',
  description: 'Creates a new tag in YouTrack.',
  props: {
    name: Property.ShortText({ displayName: 'Tag Name', description: 'Name like "Regression" or "To deploy".', required: true }),
    untagOnResolve: Property.Checkbox({ displayName: 'Remove when resolved?', required: false, defaultValue: false }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const body: Record<string, unknown> = { name: context.propsValue.name };
    if (context.propsValue.untagOnResolve !== undefined) body.untagOnResolve = context.propsValue.untagOnResolve;
    const r = await fetch(a.baseUrl.replace(/\/+$/, '') + '/api/tags?fields=id,name,owner(id,name),untagOnResolve', {
      method: HttpMethod.POST,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error('Failed: ' + JSON.stringify(data));
    return flattenObject(data);
  },
  sampleData: { id: '6-11', name: 'Regression', owner_id: '1-2', owner_name: 'John Doe', untagOnResolve: false },
});
