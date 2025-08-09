import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createSection } from './lib/actions/create-section';
import { createNotebook } from './lib/actions/create-notebook';
import { createImageNote } from './lib/actions/create-image-note';
import { appendNote } from './lib/actions/append-note';
import { newNoteInSectionTrigger } from './lib/triggers/new-note-in-section';
import { createNoteInSection } from './lib/actions/create-note-in-section';
import { createPage } from './lib/actions/create-page';

export const oneNoteAuth = PieceAuth.OAuth2({
	description:
		'Authenticate with your Microsoft Account. You will need to register an application in the Microsoft Entra admin center. Add **Notes.ReadWrite**, **User.Read**, **offline_access** scopes.',
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	required: true,
	scope: ['Notes.ReadWrite', 'User.Read', 'offline_access'],
	prompt: 'omit'
});

export const onepiece = createPiece({
	displayName: "Onepiece",
	auth: oneNoteAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: "https://cdn.activepieces.com/pieces/onepiece.png",
	authors: [],
	actions: [
		createNotebook,
		createSection,
		createNoteInSection,
		createPage,
		createImageNote,
		appendNote,
	],
	triggers: [
		newNoteInSectionTrigger,
	],
});
    