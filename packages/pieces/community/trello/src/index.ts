import {
  HttpMethod,
  HttpRequest,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCard } from './lib/actions/card/create-card';
import { getCard } from './lib/actions/card/get-card';
import { updateCard } from './lib/actions/card/update-card';
import { deleteCard } from './lib/actions/card/delete-card';
import { getCardAttachments } from './lib/actions/card-attachment/get-card-attachments';
import { addCardAttachment } from './lib/actions/card-attachment/add-card-attachment';
import { getCardAttachment } from './lib/actions/card-attachment/get-card-attachment';
import { deleteCardAttachment } from './lib/actions/card-attachment/delete-card-attachment';
// audience:'ai' agent atomics (twins reuse existing run() logic with agent-shaped props)
import { createCardAi } from './lib/actions/ai/create-card-ai';
import { getCardAi } from './lib/actions/ai/get-card-ai';
import { updateCardAi } from './lib/actions/ai/update-card-ai';
import { deleteCardAi } from './lib/actions/ai/delete-card-ai';
import { listCardAttachmentsAi } from './lib/actions/ai/list-card-attachments-ai';
import { searchCards } from './lib/actions/ai/search-cards';
import { searchMembers } from './lib/actions/ai/search-members';
import { listCardsInList } from './lib/actions/ai/list-cards-in-list';
import { listCardsInBoard } from './lib/actions/ai/list-cards-in-board';
import { addCommentToCard } from './lib/actions/ai/add-comment-to-card';
import { listCardComments } from './lib/actions/ai/list-card-comments';
import { updateComment } from './lib/actions/ai/update-comment';
import { deleteComment } from './lib/actions/ai/delete-comment';
import { addMemberToCard } from './lib/actions/ai/add-member-to-card';
import { removeMemberFromCard } from './lib/actions/ai/remove-member-from-card';
import { listCardMembers } from './lib/actions/ai/list-card-members';
import { createBoardLabel } from './lib/actions/ai/create-board-label';
import { addLabelToCard } from './lib/actions/ai/add-label-to-card';
import { removeLabelFromCard } from './lib/actions/ai/remove-label-from-card';
import { listBoardLabels } from './lib/actions/ai/list-board-labels';
import { updateLabel } from './lib/actions/ai/update-label';
import { moveCard } from './lib/actions/ai/move-card';
import { archiveCard } from './lib/actions/ai/archive-card';
import { createList } from './lib/actions/ai/create-list';
import { listLists } from './lib/actions/ai/list-lists';
import { getList } from './lib/actions/ai/get-list';
import { renameList } from './lib/actions/ai/rename-list';
import { archiveList } from './lib/actions/ai/archive-list';
import { moveAllCardsInList } from './lib/actions/ai/move-all-cards-in-list';
import { archiveAllCardsInList } from './lib/actions/ai/archive-all-cards-in-list';
import { createBoard } from './lib/actions/ai/create-board';
import { getBoard } from './lib/actions/ai/get-board';
import { listBoards } from './lib/actions/ai/list-boards';
import { updateBoard } from './lib/actions/ai/update-board';
import { archiveBoard } from './lib/actions/ai/archive-board';
import { listBoardMembers } from './lib/actions/ai/list-board-members';
import { addChecklistToCard } from './lib/actions/ai/add-checklist-to-card';
import { listCardChecklists } from './lib/actions/ai/list-card-checklists';
import { deleteChecklist } from './lib/actions/ai/delete-checklist';
import { setChecklistItemState } from './lib/actions/ai/set-checklist-item-state';
import { deleteChecklistItem } from './lib/actions/ai/delete-checklist-item';
import { addChecklistItem } from './lib/actions/ai/add-checklist-item';
import { getMyMember } from './lib/actions/ai/get-my-member';
import { getMember } from './lib/actions/ai/get-member';
import { listOrganizationBoards } from './lib/actions/ai/list-organization-boards';
import { addReactionToComment } from './lib/actions/ai/add-reaction-to-comment';
import { cardMovedTrigger } from './lib/triggers/cardMoved';
import { newCardTrigger } from './lib/triggers/newCard';
import { deadlineTrigger } from './lib/triggers/deadline';

const markdownProperty = `
To obtain your API key and token, follow these steps:

1. Go to https://trello.com/power-ups/admin.
2. Click **New** to create a new power-up.
3. Enter power-up information, and click **Create**.
4. From the API Key page, click **Generate a new API key**.
5. Copy **API Key** and enter it into the Trello API Key connection.
6. On the right side of the page, find the text *"you can manually generate a Token"* and click the **Token** link.**Do not use the Secret field below the API key**.
7. Authorize the app and copy the generated token.
8. Paste the token into the Trello Token field.
`;
export const trelloAuth = PieceAuth.BasicAuth({
  description: markdownProperty,
  required: true,
  username: {
    displayName: 'API Key',
    description: 'Trello API Key',
  },
  password: {
    displayName: 'Token',
    description: 'Trello Token',
  },
  validate: async ({ auth }) => {
    const { username, password } = auth;
    if (!username || !password) {
      return {
        valid: false,
        error: 'Empty API Key or Token',
      };
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url:
          `https://api.trello.com/1/members/me/boards` +
          `?key=` +
          username +
          `&token=` +
          password,
      };
      await httpClient.sendRequest(request);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key or Token',
      };
    }
  },
});

export const trello = createPiece({
  displayName: 'Trello',
  description: 'Project management tool for teams',
  minimumSupportedRelease: '0.85.5',
  logoUrl: 'https://cdn.activepieces.com/pieces/trello.png',
  authors: ["Salem-Alaa", "kishanprmr", "MoShizzle", "khaledmashaly", "abuaboud", "AshotZaqoyan"],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: trelloAuth,
  actions: [createCard, getCard, updateCard, deleteCard, getCardAttachments, addCardAttachment, getCardAttachment, deleteCardAttachment,
    // audience:'ai' agent atomics
    createCardAi, getCardAi, updateCardAi, deleteCardAi, listCardAttachmentsAi, searchCards, searchMembers, listCardsInList, listCardsInBoard,
    addCommentToCard, listCardComments, updateComment, deleteComment,
    addMemberToCard, removeMemberFromCard, listCardMembers,
    createBoardLabel, addLabelToCard, removeLabelFromCard, listBoardLabels, updateLabel,
    moveCard, archiveCard,
    createList, listLists, getList, renameList, archiveList, moveAllCardsInList, archiveAllCardsInList,
    createBoard, getBoard, listBoards, updateBoard, archiveBoard, listBoardMembers,
    addChecklistToCard, listCardChecklists, deleteChecklist, setChecklistItemState, deleteChecklistItem, addChecklistItem,
    getMyMember, getMember, listOrganizationBoards, addReactionToComment, createCustomApiCallAction({
      auth: trelloAuth,
      baseUrl: () => 'https://api.trello.com/1',
      authLocation: 'queryParams',
      authMapping: async (auth) => {
        return {
          key: auth.username,
          token: auth.password
        }
      }
    })
  ],
  triggers: [cardMovedTrigger, newCardTrigger, deadlineTrigger],
});
