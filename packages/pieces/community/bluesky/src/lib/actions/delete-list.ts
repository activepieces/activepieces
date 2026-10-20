import { createAction } from '@activepieces/pieces-framework';
import type { AtpAgent } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { deleteListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

const LISTITEM_COLLECTION = 'app.bsky.graph.listitem';
const DELETE_BATCH = 100;
const SCAN_PAGE_SIZE = 100;
const MAX_SCAN_PAGES = 500;

export const deleteList = createAction({
  auth: blueskyAuth,
  name: 'delete_list',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete List',
  description: 'Permanently delete one of your lists and its memberships',
  audience: 'both',
  outputSchema: deleteListOutputSchema,
  aiMetadata: {
    description:
        'Permanently deletes a list owned by the connected Bluesky account, given its bsky.app link or AT-URI: it first removes every membership record of the list from the account repository, and deletes the list only after all of them are gone; it refuses lists of other accounts. Cannot be undone. Idempotent: running it again finishes any cleanup a failed run left behind, and deleting an already-deleted list succeeds and reports existed=false.',
    idempotent: true,
  },
  props: {
    list: blueskyProps.listInputProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseListInput(propsValue.list);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'delete the list',
      fn: async (agent) => {
        const me = blueskyClient.sessionDid(agent);
        const ref = await blueskyRefs.resolveListRef({ agent, input: propsValue.list });
        if (ref.did !== me) {
          throw new Error('This list belongs to another account. You can only delete lists owned by the connected account.');
        }
        const existed = await blueskyRefs.recordExists({ agent, repo: me, collection: blueskyRefs.LIST_COLLECTION, rkey: ref.rkey });
        const itemRkeys = await listItemRkeys({ agent, repo: me, listUri: ref.uri });
        const removed = await deleteItems({ agent, repo: me, rkeys: itemRkeys });
        if (existed) {
          await agent.app.bsky.graph.list.delete({ repo: me, rkey: ref.rkey });
        }
        return {
          deleted: true,
          existed,
          uri: ref.uri,
          membersRemoved: removed,
          membersFailed: 0,
          membersComplete: true,
        };
      },
    });
  },
});

async function listItemRkeys({ agent, repo, listUri }: { agent: AtpAgent; repo: string; listUri: string }): Promise<string[]> {
  const rkeys: string[] = [];
  let cursor: string | undefined = undefined;
  for (let page = 0; page < MAX_SCAN_PAGES; page++) {
    const response: Awaited<ReturnType<typeof agent.com.atproto.repo.listRecords>> = await agent.com.atproto.repo.listRecords({
      repo,
      collection: LISTITEM_COLLECTION,
      limit: SCAN_PAGE_SIZE,
      cursor,
    });
    for (const record of response.data.records) {
      const parsed = blueskyRefs.parseAtUri(record.uri);
      if (parsed && parsed.repo === repo && parsed.collection === LISTITEM_COLLECTION && listOf(record.value) === listUri) {
        rkeys.push(parsed.rkey);
      }
    }
    const next = response.data.cursor;
    if (!next || next === cursor || response.data.records.length === 0) {
      return rkeys;
    }
    cursor = next;
  }
  throw new Error(
    `The account has more than ${(MAX_SCAN_PAGES * SCAN_PAGE_SIZE).toLocaleString('en-US')} list membership records, so not every membership of this list could be found. The list was not deleted.`,
  );
}

function listOf(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'list' in value && typeof value.list === 'string') {
    return value.list;
  }
  return undefined;
}

async function deleteItems({ agent, repo, rkeys }: { agent: AtpAgent; repo: string; rkeys: string[] }): Promise<number> {
  const batches = Array.from({ length: Math.ceil(rkeys.length / DELETE_BATCH) }, (_, index) => rkeys.slice(index * DELETE_BATCH, (index + 1) * DELETE_BATCH));
  let removed = 0;
  for (const batch of batches) {
    try {
      await agent.com.atproto.repo.applyWrites({
        repo,
        writes: batch.map((rkey) => ({ $type: 'com.atproto.repo.applyWrites#delete', collection: LISTITEM_COLLECTION, rkey })),
      });
    } catch (error) {
      const reason = blueskyClient.toBlueskyError({ error, action: 'remove list memberships' }).message;
      throw new Error(
        `Removed ${removed} of ${rkeys.length} list memberships, then Bluesky refused the next batch. The list was not deleted; run the action again to finish. (${reason})`,
      );
    }
    removed += batch.length;
  }
  return removed;
}
