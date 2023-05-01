import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { googleDriveCreateNewFolder } from './lib/action/create-new-folder';
import { googleDriveCreateNewTextFile } from './lib/action/create-new-text-file';

export const googleDrive = createPiece({
	name: 'google-drive',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-drive.png',
	actions: [googleDriveCreateNewFolder, googleDriveCreateNewTextFile],
	displayName: "Google Drive",
	authors: ['kanarelo'],
	triggers: [],
    version: packageJson.version,
    type: PieceType.PUBLIC,
});
