import { ProjectId, apId, isNil } from '@activepieces/shared'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { fileService } from '../../file/file.service'
import fs from 'fs/promises'
import path from 'path'

const basePath = path.resolve(__dirname.split(`${path.sep}dist`)[0])
const baseLinkPath = path.join(basePath, 'dist', 'private-pieces')

export const privatePiecesService = {
    async getPieceFilePath({ projectId, pieceName, pieceVersion }: { projectId: ProjectId, pieceName: string, pieceVersion: string }): Promise<string | undefined> {
        const pieceMetadata = await pieceMetadataService.get({ name: pieceName, version: pieceVersion, projectId })
        const file = await fileService.getOne({ fileId: pieceMetadata.id!, projectId })
        if (!file) return undefined
        await fs.mkdir(baseLinkPath, { recursive: true })
        const tarFilePath = path.join(baseLinkPath, `${file.id}.tar`)
        await fs.writeFile(tarFilePath, file.data)
        return tarFilePath
    },
    async saveTarToPath(data: Buffer | undefined) {
        if (isNil(data)) {
            return null
        }
        const randomId = apId()
        await fs.mkdir(baseLinkPath, { recursive: true })
        const tarFilePath = path.join(baseLinkPath, `${randomId}.tar`)
        await fs.writeFile(tarFilePath, data)
        return tarFilePath
    },
    async deleteTarFile(tarFilePath: string) {
        await fs.rm(tarFilePath)
    },
}