// Action: List Tags
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';

export const listTagsAction = createAction({
  auth: youtrackAuth,
  name: 'list_tags',
  displayName: 'List Tags',
  description: 'Lists all tags visible to the current user.',
  props: {
    query: Property.ShortText({ displayName: 'Filter by Name', description: 'Filter tags by name. Leave empty for all.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Max tags. Default 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const limit = context.propsValue.limit ?? 100;
    let url = a.baseUrl.replace(/\/+$/, '') + '/api/tags?fields=id,name,owner(id,name),visibleFor(id,name),updateableBy(id,name),untagOnResolve&$top=' + limit;
    if (context.propsValue.query) url += '&query=' + encodeURIComponent(context.propsValue.query);
    const r = await fetch(url, {
      method: HttpMethod.GET,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!r.ok) { const errText = await r.text().catch(() => String(r.status)); throw new Error('Failed: ' + errText); }
    const data = await r.json() as Array<Record<string, unknown>>;
    return (data || []).map((tag) => ({
      id: tag.id, name: tag.name,
      owner_name: (tag.owner as Record<string, unknown>)?.name ?? null,
      owner_id: (tag.owner as Record<string, unknown>)?.id ?? null,
      visible_for_name: (tag.visibleFor as Record<string, unknown>)?.name ?? 'Only me',
      updateable_by_name: (tag.updateableBy as Record<string, unknown>)?.name ?? 'Only me',
      untag_on_resolve: tag.untagOnResolve ?? false,
    }));
  },
  sampleData: [
    { id: '6-1', name: 'Star', owner_name: 'John Doe', owner_id: '1-2', visible_for_name: 'Only me', updateable_by_name: 'Only me', untag_on_resolve: false },
    { id: '6-4', name: 'To deploy', owner_name: 'John Doe', owner_id: '1-2', visible_for_name: 'All Users', updateable_by_name: 'All Users', untag_on_resolve: false },
  ],
});
