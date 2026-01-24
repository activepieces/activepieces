import { createPiece } from '@activepieces/pieces-framework';
import { pinterestAuth } from './lib/common/auth';
import { createPin } from './lib/actions/create-pin';
import { createBoard } from './lib/actions/create-board';
import { deletePin } from './lib/actions/delete-pin';
import { findBoardByName } from './lib/actions/find-board-by-name';
import { findPin } from './lib/actions/find-pin';
import { updateBoard } from './lib/actions/update-board';
import { newBoard } from './lib/triggers/new-board';
import { newFollower } from './lib/triggers/new-follower';
import { newPinOnBoard } from './lib/triggers/new-pin-on-board';

export const pinterest = createPiece({
  displayName: 'Pinterest',
  auth: pinterestAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinterest.png',
  authors: ['Sanket6652'],
  actions: [
    createPin,
    createBoard,
    deletePin,
    findBoardByName,
    findPin,
    updateBoard,
  ],
  triggers: [newBoard, newFollower, newPinOnBoard],
});
