import { ActivepiecesError, ErrorCode, MultipartFile, ProjectId, apId } from '@activepieces/shared'
import { PieceMetadataEntity } from './piece-metadata.entity'
import { PieceMetadata, PieceMetadataSummary, PieceType } from '@activepieces/pieces-framework'
import { logger } from '@backend/helper/logger'
import { databaseConnection } from '@backend/database/database-connection'
import { fileService } from '@backend/file/file.service'
import { isCloud } from '@backend/helper/secret-helper'


const repo = databaseConnection.getRepository(PieceMetadataEntity)

export const pieceMetadataService = {
    async save(projectId: ProjectId, { metadata, tarFile }: { metadata: PieceMetadata, tarFile: MultipartFile }) {
        if (!isCloud()) {
            throw new Error('Only available in cloud')
        }
        logger
            .info(`Uploading piece ${metadata.name}`)
        const existing = await repo.findOneBy({
            projectId, name: metadata.name, version: metadata.version,
        })
        if (existing) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_ALREADY_EXISTS,
                params: {
                    name: metadata.name,
                    version: metadata.version,
                },
            })
        }
        const savedTarFile = await fileService.save(projectId, tarFile.data)
        return repo.save({
            id: apId(),
            ...metadata,
            tarFileId: savedTarFile.id,
            projectId,
        })
    },
    async delete({ projectId, name }: { projectId: string, name: string }): Promise<void> {
        if (!isCloud()) {
            throw new Error('Only available in cloud')
        }
        let pieceVersions = await repo.countBy({
            name,
            projectId
        })
        if (pieceVersions === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Piece ${name} with not found`,
                },
            })
        }
        await repo.delete({
            projectId,
            name,
        })
    },
    async list({ projectId }: { projectId: string }): Promise<PieceMetadataSummary[]> {
        const metadatas = await repo.find({
            where: { projectId },
            order: { name: 'ASC', created: 'DESC' },
        })

        const uniqueMetadatas = new Map<string, PieceMetadataSummary>()
        metadatas.forEach((metadata) => {
            const summary = uniqueMetadatas.get(metadata.name)
            if (!summary) {
                uniqueMetadatas.set(metadata.name, {
                    ...metadata,
                    tarFileId: metadata.tarFileId,
                    type: PieceType.PRIVATE,
                    actions: Object.keys(metadata.actions).length,
                    triggers: Object.keys(metadata.triggers).length,
                })
            }
        })

        return Array.from(uniqueMetadatas.values())
    },
    async getMetadata({ projectId, name, version }: { projectId: string, name: string, version: string | undefined }) {
        const metadata = await repo.findOneBy({
            name,
            projectId,
            version,
        })
        if (!metadata) {
            return metadata
        }
        return {
            ...metadata,
            tarFileId: metadata.tarFileId,
            type: PieceType.PRIVATE,
        }
    },
    async getMetadataOrThrow({ projectId, name, version }: { projectId: string, name: string, version: string | undefined }) {
        const metadata = await this.getMetadata({
            name,
            projectId,
            version,
        })
        if (!metadata) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Piece ${name} with version ${version} not found`,
                },
            })
        }
        return metadata
    },
    async getPackage({ projectId, name, version }: { projectId: ProjectId, name: string, version: string | undefined }) {
        const metadata = await this.getMetadataOrThrow({ projectId, name, version })
        const file = await fileService.getOne({ projectId, fileId: metadata.tarFileId })
        return file?.data
    },
}