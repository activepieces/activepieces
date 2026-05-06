import { FolderOperation, FolderOperationType, FolderState, isNil } from '@activepieces/shared'
import deepEqual from 'deep-equal'

export const folderDiffService = {
    diff({ newFolders, currentFolders }: DiffParams): FolderOperation[] {
        const creates: FolderOperation[] = newFolders
            .filter((folder) => isNil(currentFolders.find((c) => c.externalId === folder.externalId)))
            .map((folder) => ({ type: FolderOperationType.CREATE_FOLDER, folderState: folder }))

        const updates: FolderOperation[] = []
        currentFolders.forEach((folder) => {
            const newFolder = newFolders.find((f) => f.externalId === folder.externalId)
            if (!isNil(newFolder) && !deepEqual(toFingerprint(folder), toFingerprint(newFolder))) {
                updates.push({
                    type: FolderOperationType.UPDATE_FOLDER,
                    folderState: folder,
                    newFolderState: newFolder,
                })
            }
        })

        const deletes: FolderOperation[] = currentFolders
            .filter((folder) => isNil(newFolders.find((n) => n.externalId === folder.externalId)))
            .map((folder) => ({ type: FolderOperationType.DELETE_FOLDER, folderState: folder }))

        return [...creates, ...updates, ...deletes]
    },
}

function toFingerprint(folder: FolderState): FolderFingerprint {
    return {
        externalId: folder.externalId,
        displayName: folder.displayName,
        displayOrder: folder.displayOrder,
    }
}

type FolderFingerprint = {
    externalId: string
    displayName: string
    displayOrder: number
}

type DiffParams = {
    newFolders: FolderState[]
    currentFolders: FolderState[]
}
