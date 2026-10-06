import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { addListMemberOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const addUserToList = createAction({
  auth: blueskyAuth,
  name: 'add_user_to_list',
  classification: 'WRITE',
  displayName: 'Add User to List',
  description: 'Add an account to one of your lists',
  audience: 'both',
  outputSchema: addListMemberOutputSchema,
  aiMetadata: {
    description:
      'Adds a Bluesky account (handle, DID or profile link) to a list owned by the connected account, given the list\'s link or AT-URI. Use Remove User from List to undo. Not idempotent: calling it twice adds a second membership record for the same account.',
    idempotent: false,
  },
  props: {
    list: blueskyProps.listInputProperty(),
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to add.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseListInput(propsValue.list);
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'add the account to the list',
      fn: async (agent) => {
        const me = blueskyClient.sessionDid(agent);
        const list = await blueskyRefs.resolveListRef({ agent, input: propsValue.list });
        if (list.did !== me) {
          throw new Error('This list belongs to another account. You can only add members to lists owned by the connected account.');
        }
        const did = await blueskyRefs.resolveActorDid({ agent, input: propsValue.actor });
        const response = await agent.app.bsky.graph.listitem.create({ repo: me }, { subject: did, list: list.uri, createdAt: new Date().toISOString() });
        return { listItemUri: response.uri, listItemCid: response.cid, listUri: list.uri, did };
      },
    });
  },
});
