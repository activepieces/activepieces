import { PieceAuth, createPiece } from '@activepieces/pieces-framework';

import { googleDriveCreateNewFolder } from './lib/action/create-new-folder';
import { googleDriveCreateNewTextFile } from './lib/action/create-new-text-file';
import { googleDriveUploadFile } from './lib/action/upload-file';
import { newFile } from './lib/triggers/new-file';
import { newFolder } from './lib/triggers/new-folder';

export const googleDriveAuth = PieceAuth.OAuth2({
    description: "",
    displayName: 'Authentication',
    authUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    required: true,
    scope: ["https://www.googleapis.com/auth/drive"]
})

export const googleDrive = createPiece({
	minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/google-drive.png',
	actions: [googleDriveCreateNewFolder, googleDriveCreateNewTextFile, googleDriveUploadFile],
	displayName: "Google Drive",
	authors: ['kanarelo', 'BastienMe', 'MoShizzle'],
	triggers: [newFile, newFolder],
    auth: googleDriveAuth,
});
