import { apId } from '@activepieces/shared'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { tagService } from '../tag-service'
import { PieceTagEntity } from './piece-tag.entity'


const pieceTagsRepo = repoFactory(PieceTagEntity)

export const pieceTagService = {
    async set(platformId: string, pieceName: string, tags: string[]): Promise<void> {
        const tagIds = await Promise.all(tags.map(tag => tagService.upsert(platformId, tag).then(tag => tag.id)))
        await pieceTagsRepo().delete({ pieceName, platformId })
        await pieceTagsRepo().upsert(tagIds.map(tagId => ({ id: apId(), tagId, pieceName, platformId })), ['tagId', 'pieceName'])
    },
    async findByPlatform(platformId: string):  Promise<Record<string, string[]>> {
        const pieceTags = await pieceTagsRepo().findBy({ platformId })
        const tagIds = Array.from(new Set(pieceTags.map(pieceTag => pieceTag.tagId)))
        const tags = await tagService.findNamesByIds(tagIds)
        return pieceTags.reduce((acc, pieceTag) => {
            acc[pieceTag.pieceName] = acc[pieceTag.pieceName] || []
            acc[pieceTag.pieceName].push(tags[pieceTag.tagId])
            return acc
        }, {} as Record<string, string[]>)
    },
    async findByPlatformAndTags(platformId: string, pieceTags: string[]): Promise<string[]> {
        const tagIds = await tagService.convertIdsToNames(platformId, pieceTags)
        const pieceTagEntities = await pieceTagsRepo().findBy({
            platformId,
            tagId: In(tagIds),
        })
        return pieceTagEntities.map(pieceTag => pieceTag.pieceName)
    },

}