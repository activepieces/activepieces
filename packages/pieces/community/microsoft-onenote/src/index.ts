import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createSection } from './lib/actions/create-section';
import { createNotebook } from './lib/actions/create-notebook';
import { createImageNote } from './lib/actions/create-image-note';
import { appendNote } from './lib/actions/append-note';
import { newNoteInSectionTrigger } from './lib/triggers/new-note-in-section';
import { createNoteInSection } from './lib/actions/create-note-in-section';
import { createPage } from './lib/actions/create-page';
import { PieceCategory } from "@activepieces/shared";


const authDesc = `
1. Sign in to [Microsoft Azure Portal](https://portal.azure.com/).
2. From the left sidebar, go to **Microsoft Enfra ID**.
3. Under **Manage**, click on **App registrations**.
4. Click the **New registration** button.
5. Enter a **Name** for your app.
6. For **Supported account types**, choose:
   - **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts**
   - Or select based on your requirement.
7. In **Redirect URI**, select **Web** and add the given URL.
8. Click **Register**.
9. After registration, you’ll be redirected to the app’s overview page. Copy the **Application (client) ID**.
10. From the left menu, go to **Certificates & secrets**.
    - Under **Client secrets**, click **New client secret**.
    - Provide a description, set an expiry, and click **Add**.
    - Copy the **Value** of the client secret (this will not be shown again).
11. Go to **API permissions** from the left menu.
    - Click **Add a permission**.
    - Select **Microsoft Graph** → **Delegated permissions**.
    - Add the following scopes:
      - Notes.ReadWrite
      - offline_access
	  - User.Read
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`

export const oneNoteAuth = PieceAuth.OAuth2({
	description:authDesc,
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	required: true,
	scope: ['Notes.ReadWrite', 'User.Read', 'offline_access'],
	prompt: 'omit'
});

export const microsoftOnenote = createPiece({
	displayName: "Microsoft OneNote",
	description: "Microsoft OneNote is a note-taking app that allows you to create, edit, and share notes with others.",
	categories: [PieceCategory.PRODUCTIVITY],
	auth: oneNoteAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: "https://cdn.activepieces.com/pieces/microsoft-onenote.png",
	authors: ['fortunamide', 'onyedikachi-david'],
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
    