import type { ListItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointClient } from './client';

import type { MicrosoftSharePointAuthValue } from './types';

async function listItemUniqueId({
  auth,
  siteId,
  listId,
  listItemId,
}: {
  auth: MicrosoftSharePointAuthValue;
  siteId: string;
  listId: string;
  listItemId: string;
}): Promise<string> {
  if (!/^\d+$/.test(listItemId)) {
    return listItemId;
  }
  const item: ListItem = await microsoftSharePointClient
    .create({ auth })
    .api(
      `/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(listItemId)}`
    )
    .select('sharepointIds')
    .get();
  const uniqueId = item.sharepointIds?.listItemUniqueId;
  if (!uniqueId) {
    throw new Error(`List item ${listItemId} has no listItemUniqueId, so its analytics cannot be read.`);
  }
  return uniqueId;
}

export const microsoftSharePointApi = {
  listItemUniqueId,
};
