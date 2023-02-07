import { createPiece } from '../../framework/piece';
import { googleDriveCeateNewFolder } from './action/create-new-folder';

export const googleDrive = createPiece({
	name: 'google_drive',
	logoUrl: 'https://kstatic.googleusercontent.com/files/d57b24106c34c7e50ef3d98423b94ddaf35ad2da73a9b9d4d12f52dbb9dd4c08c2957f6255ab8690d5ef0b32cff8287e09577d05e479d263e872160c4c9e8363',
	actions: [googleDriveCeateNewFolder],
	displayName: "Google Drive",
	triggers: [],
});