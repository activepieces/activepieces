import { ListTagsRequest, SeekPage, Tag } from "@activepieces/shared"
import { repoFactory } from "../core/db/repo-factory"
import { TagEntity } from "./tag-entity"
import { PieceTagEntity } from "./tag-piece.entity"
import { In } from "typeorm"
import { paginationHelper } from "../helper/pagination/pagination-utils"
import { buildPaginator } from "../helper/pagination/build-paginator"


const repo = repoFactory(TagEntity)
const pieceTagsRepo = repoFactory(PieceTagEntity)

export const tagService = {
    async setPieceTags(platformId: string, pieceName: string, tags: string[]): Promise<void> {
        const tagIds = await Promise.all(tags.map(tag => upsertTag(platformId, tag).then(tag => tag.id)))
        await pieceTagsRepo().delete({ pieceName, platformId })
        await pieceTagsRepo().upsert(tagIds.map(tagId => ({ tagId, pieceName, platformId })), ['tagId', 'pieceName'])
    },
    async getPieceTags(platformId: string): Promise<Record<string, string[]>> {
        const pieceTags = await pieceTagsRepo().findBy({ platformId })
        const tagIds = Array.from(new Set(pieceTags.map(pieceTag => pieceTag.tagId)))
        const tags = await tagIdsToNames(tagIds)
        return pieceTags.reduce((acc, pieceTag) => {
            acc[pieceTag.pieceName] = acc[pieceTag.pieceName] || []
            acc[pieceTag.pieceName].push(tags[pieceTag.tagId])
            return acc
        }, {} as Record<string, string[]>)
    },
    async list({ platformId, request }: { platformId: string, request: ListTagsRequest }): Promise<SeekPage<Tag>> {
        const decodedCursor = paginationHelper.decodeCursor(request.cursor ?? null)
        const paginator = buildPaginator({
            entity: TagEntity,
            query: {
                limit: request.limit ?? 10,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(
            repo().createQueryBuilder().where({ platformId }),
        )
        return paginationHelper.createPage<Tag>(data, cursor)
    }
}
async function tagIdsToNames(tagIds: string[]): Promise<Record<string, string>> {
    const tagEntities = await repo().findBy({
        id: In(tagIds)
    })
    return tagEntities.reduce((acc, tag) => {
        acc[tag.id] = tag.name
        return acc
    }, {} as Record<string, string>)
}

async function upsertTag(platformId: string, name: string): Promise<Tag> {
    const existingTag = await repo().findOneBy({ name, platformId })
    if (existingTag) {
        return existingTag
    }
    await repo().upsert({ name, platformId }, ['name', 'platformId'])
    return repo().findOneByOrFail({ name, platformId })
}