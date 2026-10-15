import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { removeListMemberOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const removeUserFromList = createAction({
  auth: blueskyAuth,
  name: 'remove_user_from_list',
  classification: 'WRITE',
  displayName: 'Remove User from List',
  description: 'Remove an account from one of your lists',
  audience: 'both',
  outputSchema: removeListMemberOutputSchema,
  aiMetadata: {
    description:
      'Removes every membership of a Bluesky account (handle, DID or profile link) from a list owned by the connected account, given the list\'s link or AT-URI. Use to undo Add User to List. Idempotent: when the account is not on the list it changes nothing and returns removed=0.',
    idempotent: true,
  },
  props: {
    list: blueskyProps.listInputProperty(),
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to remove.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseListInput(propsValue.list);
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'remove the account from the list',
      fn: async (agent) => {
        const me = blueskyClient.sessionDid(agent);
        const list = await blueskyRefs.resolveListRef({ agent, input: propsValue.list });
        if (list.did !== me) {
          throw new Error('This list belongs to another account. You can only remove members from lists owned by the connected account.');
        }
        const did = await blueskyRefs.resolveActorDid({ agent, input: propsValue.actor });
        const members = await blueskyRefs.listMembers({ agent, listUri: list.uri });
        if (!members.complete) {
          throw new Error('The list is too large to search completely (more than 5,000 members); nothing was removed.');
        }
        const rkeys = members.items.flatMap((item) => {
          const parsed = item.subject.did === did ? blueskyRefs.parseAtUri(item.uri) : null;
          return parsed && parsed.repo === me ? [parsed.rkey] : [];
        });
        for (const rkey of rkeys) {
          await agent.app.bsky.graph.listitem.delete({ repo: me, rkey });
        }
        return { removed: rkeys.length, listUri: list.uri, did };
      },
    });
  },
});
