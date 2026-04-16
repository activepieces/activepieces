import { AuthenticationType, createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { airtableAddCommentToRecordAction } from './lib/actions/add-comment-to-record'
import { airtableCleanRecordAction } from './lib/actions/clean-record'
import { airtableCreateBaseAction } from './lib/actions/create-base'
import { airtableCreateRecordAction } from './lib/actions/create-record'
import { airtableCreateTableAction } from './lib/actions/create-table'
import { airtableDeleteRecordAction } from './lib/actions/delete-record'
import { airtableFindBaseAction } from './lib/actions/find-base'
import { airtableFindRecordAction } from './lib/actions/find-record'
import { airtableGetRecordByIdAction } from './lib/actions/find-record-by-id'
import { airtableFindTableAction } from './lib/actions/find-table'
import { airtableFindTableByIdAction } from './lib/actions/find-table-by-id'
import { airtableGetBaseSchemaAction } from './lib/actions/get-base-schema'
import { airtableUpdateRecordAction } from './lib/actions/update-record'
import { airtableUploadFileToColumnAction } from './lib/actions/upload-file-to-column'
import { airtableAuth } from './lib/auth'
import { airtableNewRecordTrigger } from './lib/trigger/new-record.trigger'
import { airtableUpdatedRecordTrigger } from './lib/trigger/update-record.trigger'

export const airtable = createPiece({
    displayName: 'Airtable',
    description: 'Low‒code platform to build apps.',

    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
    authors: [
        'kanarelo',
        'TaskMagicKyle',
        'Salem-Alaa',
        'kishanprmr',
        'MoShizzle',
        'AbdulTheActivePiecer',
        'khaledmashaly',
        'abuaboud',
        'Pranith124',
        'onyedikachi-david',
        'bst1n',
        'sanket-a11y',
    ],
    categories: [PieceCategory.PRODUCTIVITY],
    auth: airtableAuth,
    actions: [
        airtableCreateRecordAction,
        airtableFindRecordAction,
        airtableUpdateRecordAction,
        airtableCleanRecordAction,
        airtableDeleteRecordAction,
        airtableUploadFileToColumnAction,
        airtableAddCommentToRecordAction,
        airtableCreateBaseAction,
        airtableCreateTableAction,
        airtableFindBaseAction,
        airtableFindTableByIdAction,
        airtableGetRecordByIdAction,
        airtableFindTableAction,
        airtableGetBaseSchemaAction,
        createCustomApiCallAction({
            baseUrl: () => {
                return 'https://api.airtable.com/v0'
            },
            auth: airtableAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [airtableNewRecordTrigger, airtableUpdatedRecordTrigger],
})
