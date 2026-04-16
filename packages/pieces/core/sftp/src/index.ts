import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createFile } from './lib/actions/create-file'
import { createFolderAction } from './lib/actions/create-folder'
import { deleteFileAction } from './lib/actions/delete-file'
import { deleteFolderAction } from './lib/actions/delete-folder'
import { listFolderContentsAction } from './lib/actions/list-files'
import { readFileContent } from './lib/actions/read-file'
import { renameFileOrFolderAction } from './lib/actions/rename-file-or-folder'
import { uploadFileAction } from './lib/actions/upload-file'
import { sftpAuth } from './lib/auth'
import { newOrModifiedFile } from './lib/triggers/new-modified-file'

export { endClient, getClient, getProtocolBackwardCompatibility } from './lib/common'

export const ftpSftp = createPiece({
    displayName: 'FTP/SFTP',
    description: 'Connect to FTP, FTPS or SFTP servers',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/sftp.svg',
    categories: [PieceCategory.CORE, PieceCategory.DEVELOPER_TOOLS],
    authors: [
        'Abdallah-Alwarawreh',
        'kishanprmr',
        'AbdulTheActivePiecer',
        'khaledmashaly',
        'abuaboud',
        'prasanna2000-max',
    ],
    auth: sftpAuth,
    actions: [
        createFile,
        uploadFileAction,
        readFileContent,
        deleteFileAction,
        createFolderAction,
        deleteFolderAction,
        listFolderContentsAction,
        renameFileOrFolderAction,
    ],
    triggers: [newOrModifiedFile],
})
