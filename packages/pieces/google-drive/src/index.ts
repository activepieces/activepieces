import { createPiece } from '@activepieces/pieces-framework';
import { googleDriveCreateNewFolder } from './lib/action/create-new-folder';
import { googleDriveCreateNewTextFile } from './lib/action/create-new-text-file';

export const googleDrive = createPiece({
	logoUrl: 'https://cdn.activepieces.com/pieces/google-drive.png',
	actions: [googleDriveCreateNewFolder, googleDriveCreateNewTextFile],
	displayName: "Google Drive",
	authors: ['kanarelo'],
	triggers: [],
});
