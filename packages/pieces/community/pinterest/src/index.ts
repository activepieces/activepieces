import { createPiece } from '@activepieces/pieces-framework';
import { pinterestAuth } from './lib/common/auth';
import { createPin } from './lib/actions/create-pin';
import { createBoard } from './lib/actions/create-board';
import { deletePin } from './lib/actions/delete-pin';
import { findBoardByName } from './lib/actions/find-board-by-name';
import { findPin } from './lib/actions/find-pin';
import { updateBoard } from './lib/actions/update-board';
import { listBoards } from './lib/actions/list-boards';
import { getBoard } from './lib/actions/get-board';
import { deleteBoard } from './lib/actions/delete-board';
import { listPinsOnBoard } from './lib/actions/list-pins-on-board';
import { listBoardSections } from './lib/actions/list-board-sections';
import { createBoardSection } from './lib/actions/create-board-section';
import { renameBoardSection } from './lib/actions/rename-board-section';
import { deleteBoardSection } from './lib/actions/delete-board-section';
import { listPinsOnBoardSection } from './lib/actions/list-pins-on-board-section';
import { listPins } from './lib/actions/list-pins';
import { getPin } from './lib/actions/get-pin';
import { savePin } from './lib/actions/save-pin';
import { getPinAnalytics } from './lib/actions/get-pin-analytics';
import { listPinProductTags } from './lib/actions/list-pin-product-tags';
import { getUserAccount } from './lib/actions/get-user-account';
import { getUserAccountAnalytics } from './lib/actions/get-user-account-analytics';
import { getTopPinsAnalytics } from './lib/actions/get-top-pins-analytics';
import { getTopVideoPinsAnalytics } from './lib/actions/get-top-video-pins-analytics';
import { listFollowers } from './lib/actions/list-followers';
import { listFollowing } from './lib/actions/list-following';
import { listFollowedBoards } from './lib/actions/list-followed-boards';
import { listLinkedBusinesses } from './lib/actions/list-linked-businesses';
import { listVerifiedWebsites } from './lib/actions/list-verified-websites';
import { createPinFromMedia } from './lib/actions/create-pin-from-media';
import { createNewBoard } from './lib/actions/create-new-board';
import { deletePinById } from './lib/actions/delete-pin-by-id';
import { updateBoardDetails } from './lib/actions/update-board-details';
import { searchBoards } from './lib/actions/search-boards';
import { searchPins } from './lib/actions/search-pins';
import { newBoard } from './lib/triggers/new-board';
import { newFollower } from './lib/triggers/new-follower';
import { newPinOnBoard } from './lib/triggers/new-pin-on-board';

export const pinterest = createPiece({
  displayName: 'Pinterest',
  auth: pinterestAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinterest.png',
  authors: ['Sanket6652', 'OdaiAhmed99'],
  actions: [
    createPin,
    createBoard,
    deletePin,
    findBoardByName,
    findPin,
    updateBoard,
    listBoards,
    getBoard,
    createNewBoard,
    updateBoardDetails,
    deleteBoard,
    searchBoards,
    listBoardSections,
    createBoardSection,
    renameBoardSection,
    deleteBoardSection,
    listPinsOnBoard,
    listPinsOnBoardSection,
    listPins,
    getPin,
    searchPins,
    createPinFromMedia,
    savePin,
    deletePinById,
    listPinProductTags,
    getPinAnalytics,
    getUserAccount,
    getUserAccountAnalytics,
    getTopPinsAnalytics,
    getTopVideoPinsAnalytics,
    listFollowers,
    listFollowing,
    listFollowedBoards,
    listLinkedBusinesses,
    listVerifiedWebsites,
  ],
  triggers: [newBoard, newFollower, newPinOnBoard],
});
