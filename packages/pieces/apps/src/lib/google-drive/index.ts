import { createPiece } from '@activepieces/framework';
import { googleDriveCreateNewFolder } from './action/create-new-folder';
import { googleDriveCreateNewTextFile } from './action/create-new-text-file';

export const googleDrive = createPiece({
	name: 'google_drive',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_drive.png',
	actions: [googleDriveCreateNewFolder, googleDriveCreateNewTextFile],
	displayName: "Google Drive",
	authors: ['kanarelo'],
	triggers: [],
  version: '0.0.0',
});
