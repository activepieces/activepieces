import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'

// Actions
import { addRowToSheet } from './lib/actions/add-row-to-sheet'
import { attachFileToRow } from './lib/actions/attach-file-to-row'
import { findAttachmentByRowId } from './lib/actions/find-attachment-by-row-id'
import { findRowsByQuery } from './lib/actions/find-rows-by-query'
import { findSheetByName } from './lib/actions/find-sheet-by-name'
import { updateRow } from './lib/actions/update-row'
import { smartsheetAuth } from './lib/auth'
import { newAttachmentTrigger } from './lib/triggers/new-attachment-trigger'
import { newCommentTrigger } from './lib/triggers/new-comment-trigger'
// Webhook Triggers
import { newRowAddedTrigger } from './lib/triggers/new-row-trigger'
import { updatedRowTrigger } from './lib/triggers/updated-row-trigger'

const markdownDescription = `
To obtain your Smartsheet access token:

1. Sign in to your Smartsheet account.
2. Click on your profile picture in the top right corner.
3. Select **Personal Settings** from the dropdown menu.
4. In the left panel, click **API Access**.
5. Click **Generate new access token**.
6. Enter a name for your token (e.g., "Activepieces Integration").
7. Click **OK** to generate the token..
8. Copy the access token and paste it into the connection field.
`

export const smartsheet = createPiece({
    displayName: 'Smartsheet',
    description:
        'Dynamic work execution platform for teams to plan, capture, manage, automate, and report on work at scale.',
    auth: smartsheetAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/smartsheet.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['onyedikachi-david', 'kishanprmr'],
    actions: [addRowToSheet, updateRow, attachFileToRow, findRowsByQuery, findAttachmentByRowId, findSheetByName],
    triggers: [newRowAddedTrigger, updatedRowTrigger, newAttachmentTrigger, newCommentTrigger],
})
