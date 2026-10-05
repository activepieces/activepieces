import { createAction } from '@activepieces/pieces-framework';
import { AtpAgent } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { deleteListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

const LISTITEM_COLLECTION = 'app.bsky.graph.listitem';
const DELETE_BATCH = 100;

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
      'Permanently deletes a list owned by the connected Bluesky account, given its bsky.app link or AT-URI, and then removes its membership records; it refuses lists of other accounts. Cannot be undone. Idempotent: deleting an already-deleted list succeeds and reports existed=false.',
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
        if (!existed) {
          return { deleted: true, existed: false, uri: ref.uri, membersRemoved: 0, membersFailed: 0, membersComplete: true };
        }
        const members = await blueskyRefs.listMembers({ agent, listUri: ref.uri });
        await agent.app.bsky.graph.list.delete({ repo: me, rkey: ref.rkey });
        const itemRkeys = members.items.flatMap((item) => {
          const parsed = blueskyRefs.parseAtUri(item.uri);
          return parsed && parsed.repo === me && parsed.collection === LISTITEM_COLLECTION ? [parsed.rkey] : [];
        });
        const result = await deleteItems({ agent, repo: me, rkeys: itemRkeys });
        return {
          deleted: true,
          existed: true,
          uri: ref.uri,
          membersRemoved: result.removed,
          membersFailed: result.failed,
          membersComplete: members.complete,
        };
      },
    });
  },
});

async function deleteItems({ agent, repo, rkeys }: { agent: AtpAgent; repo: string; rkeys: string[] }): Promise<{ removed: number; failed: number }> {
  const batches = Array.from({ length: Math.ceil(rkeys.length / DELETE_BATCH) }, (_, index) => rkeys.slice(index * DELETE_BATCH, (index + 1) * DELETE_BATCH));
  let removed = 0;
  let failed = 0;
  for (const batch of batches) {
    try {
      await agent.com.atproto.repo.applyWrites({
        repo,
        writes: batch.map((rkey) => ({ $type: 'com.atproto.repo.applyWrites#delete', collection: LISTITEM_COLLECTION, rkey })),
      });
      removed += batch.length;
    } catch {
      failed += batch.length;
    }
  }
  return { removed, failed };
}
