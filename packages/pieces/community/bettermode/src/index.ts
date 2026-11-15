import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getCurrentMemberAction, getNetworkAction } from './lib/actions/ai/account';
import {
  assignBadgeToMemberAction,
  listBadgesAction,
  listEventsAction,
  listModerationItemsAction,
  registerForEventAction,
  revokeBadgeFromMemberAction,
} from './lib/actions/ai/community';
import {
  deleteMemberAction,
  findMemberByEmailAction,
  getMemberAction,
  inviteMembersAction,
  listMembersAction,
  sendDirectMessageAction,
  suspendMemberAction,
  unsuspendMemberAction,
  updateMemberAction,
} from './lib/actions/ai/members';
import {
  addReactionAction,
  createPostAction,
  createReplyAction,
  deletePostAction,
  getPostAction,
  hidePostAction,
  listPostsAction,
  listPostTypesAction,
  listRepliesAction,
  listTagsAction,
  movePostAction,
  pinPostAction,
  removeReactionAction,
  searchPostsAction,
  unhidePostAction,
  unpinPostAction,
  updatePostAction,
} from './lib/actions/ai/posts';
import {
  addMemberToSpaceAction,
  getSpaceAction,
  listSpaceMembersAction,
  listSpacesAction,
  removeMemberFromSpaceAction,
} from './lib/actions/ai/spaces';
import { assignBadgeAction } from './lib/actions/assign-badge';
import { createDiscussionAction } from './lib/actions/create-discussion';
import { createQuestionAction } from './lib/actions/create-question';
import { revokeBadgeAction } from './lib/actions/revoke-badge';
import { bettermodeAuth } from './lib/auth';
import {
  assertCustomCallUrl,
  assertRegion,
  BettermodeCredentials,
  BettermodeTokenStore,
  bindTokenStore,
  getSession,
  readPath,
} from './lib/common/client';
import { newMemberTrigger } from './lib/triggers/new-member';
import { newPostTrigger } from './lib/triggers/new-post';
import { newReplyTrigger } from './lib/triggers/new-reply';

function withTokenStore<T extends { run: unknown; test: unknown }>(action: T & { run: StoreRunner; test: StoreRunner }): T {
  return Object.assign(action, { run: bindingStore(action.run), test: bindingStore(action.test) });
}

function bindingStore<C extends StoreContext, R>(run: (context: C) => Promise<R>): (context: C) => Promise<R> {
  return async (context) => {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    return run(context);
  };
}

export const bettermode = createPiece({
  displayName: 'Bettermode',
  description:
    'Feature-rich engagement platform. Browse beautifully designed templates, each flexible for precise customization to your needs.',
  auth: bettermodeAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/bettermode.png',
  categories: [PieceCategory.MARKETING],
  authors: ['joeworkman', 'kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    createDiscussionAction,
    createQuestionAction,
    assignBadgeAction,
    revokeBadgeAction,
    getCurrentMemberAction,
    getNetworkAction,
    listSpacesAction,
    getSpaceAction,
    listSpaceMembersAction,
    addMemberToSpaceAction,
    removeMemberFromSpaceAction,
    listPostTypesAction,
    listPostsAction,
    searchPostsAction,
    getPostAction,
    createPostAction,
    updatePostAction,
    deletePostAction,
    listRepliesAction,
    createReplyAction,
    addReactionAction,
    removeReactionAction,
    pinPostAction,
    unpinPostAction,
    hidePostAction,
    unhidePostAction,
    movePostAction,
    listTagsAction,
    findMemberByEmailAction,
    getMemberAction,
    listMembersAction,
    updateMemberAction,
    inviteMembersAction,
    suspendMemberAction,
    unsuspendMemberAction,
    deleteMemberAction,
    sendDirectMessageAction,
    listBadgesAction,
    assignBadgeToMemberAction,
    revokeBadgeFromMemberAction,
    listEventsAction,
    registerForEventAction,
    listModerationItemsAction,
    withTokenStore(createCustomApiCallAction({
      baseUrl: (auth) => (auth ? assertRegion(auth.props.region) : ''),
      auth: bettermodeAuth,
      authMapping: async (auth, propsValue) => {
        assertCustomCallUrl({ region: auth.props.region, url: readPath({ value: propsValue, path: ['url', 'url'] }) });
        return { Authorization: `Bearer ${(await getSession(auth.props)).token}` };
      },
    })),
  ],
  triggers: [newPostTrigger, newMemberTrigger, newReplyTrigger],
});

type StoreContext = { auth: { props: BettermodeCredentials }; store: BettermodeTokenStore };
type StoreRunner = (context: never) => Promise<unknown>;
