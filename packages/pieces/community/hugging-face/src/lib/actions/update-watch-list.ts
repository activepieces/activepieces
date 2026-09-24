import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfRepo } from '../common/repo';
import { hfSettingsApi, hfWebhooks, WatchedItem } from '../common/webhooks';

export const updateWatchList = createAction({
  auth: huggingFaceAuth,
  name: 'update_watch_list',
  classification: 'WRITE',
  displayName: 'Watch or Unwatch',
  description: 'Start or stop watching Hugging Face users, organizations or repositories.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Adds items to, or removes items from, the connected account's Hub watch list, which controls the discussion notifications the user receives. Items are users, organizations, or model, dataset or Space repositories, given by name; each is resolved to its Hub ObjectId first, so an unknown name fails with 404 before anything changes. Only the listed items change; the rest of the watch list is untouched. Needs a 'write' role token. Safe to retry: watching an already-watched item or unwatching one that is not watched is a no-op.",
    idempotent: true,
  },
  props: {
    watch: hfWebhooks.watchedItemsProp({
      required: false,
      description: 'Users, organizations or repositories to start watching.',
    }),
    unwatch: hfWebhooks.watchedItemsProp({
      required: false,
      description: 'Users, organizations or repositories to stop watching.',
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const toWatch = hfWebhooks.parseWatched(context.propsValue.watch);
    const toUnwatch = hfWebhooks.parseWatched(context.propsValue.unwatch);
    if (toWatch.length === 0 && toUnwatch.length === 0) {
      throw new Error('Provide at least one item to watch or unwatch.');
    }
    const added = await Promise.all(toWatch.map((item) => resolveWatchTarget({ token, item })));
    const removed = await Promise.all(toUnwatch.map((item) => resolveWatchTarget({ token, item })));
    await hfSettingsApi.request<unknown>({
      token,
      method: HttpMethod.PATCH,
      path: '/api/settings/watch',
      body: {
        add: added.map(({ id, watch_type }) => ({ id, type: watch_type })),
        delete: removed.map(({ id, watch_type }) => ({ id, type: watch_type })),
      },
    });
    return {
      watched: added,
      unwatched: removed,
      watched_count: added.length,
      unwatched_count: removed.length,
    };
  },
});

async function resolveWatchTarget({ token, item }: ResolveWatchTargetParams): Promise<WatchTarget> {
  const response = await hfHub.request<unknown>({
    token,
    method: HttpMethod.GET,
    path: lookupPath(item),
  });
  const body = hfHub.isRecord(response.body) ? response.body : {};
  const id = body['_id'];
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    throw new Error(`Could not resolve the Hub ID of ${item.type} '${item.name}'. Check the name and type.`);
  }
  const canonicalName = typeof body['id'] === 'string' ? body['id'] : item.name;
  return {
    type: item.type,
    name: item.type === 'user' || item.type === 'org' ? item.name : canonicalName,
    id,
    watch_type: item.type === 'user' || item.type === 'org' ? item.type : 'repo',
  };
}

function lookupPath(item: WatchedItem): string {
  switch (item.type) {
    case 'user':
      return `/api/users/${encodeURIComponent(item.name)}/overview`;
    case 'org':
      return `/api/organizations/${encodeURIComponent(item.name)}/overview`;
    default:
      return `/api/${hfRepo.getTypeInfo(item.type).apiSegment}/${hfRepo.encodeRepoId(item.name)}`;
  }
}

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

type ResolveWatchTargetParams = {
  token: string;
  item: WatchedItem;
};

type WatchTarget = {
  type: string;
  name: string;
  id: string;
  watch_type: 'user' | 'org' | 'repo';
};
