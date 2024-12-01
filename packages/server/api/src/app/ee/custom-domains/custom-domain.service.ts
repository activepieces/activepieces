import {
    CustomDomain,
    CustomDomainStatus,
    ListCustomDomainsRequest,
} from '@activepieces/ee-shared'
import { system } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, apId, ErrorCode, isNil, SeekPage } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { CustomDomainEntity } from './custom-domain.entity'

const customDomainRepo = repoFactory<CustomDomain>(CustomDomainEntity)

export const customDomainService = {
    async delete(request: { id: string, platformId: string }): Promise<void> {
        await customDomainRepo().delete({
            id: request.id,
            platformId: request.platformId,
        })
    },
    async getOneByIdOrThrow(id: string) {
        const customDomain = await customDomainRepo().findOneBy({
            id,
        })

        if (isNil(customDomain)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'CustomDomain',
                    entityId: id,
                },
            })
        }
        return customDomain
    },
    async getOneByDomain(request: {
        domain: string
    }): Promise<CustomDomain | null> {
        return customDomainRepo().findOneBy({
            domain: request.domain,
        })
    },
    async getOneByPlatform(request: {
        platformId: string
    }): Promise<CustomDomain | null> {
        return customDomainRepo().findOneBy({
            platformId: request.platformId,
        })
    },
    async verifyDomain(request: {
        platformId: string
        id: string
    }): Promise<void> {
        await customDomainRepo().update({
            platformId: request.platformId,
            id: request.id,
        }, {
            status: CustomDomainStatus.ACTIVE,
        })

    },
    async create(request: {
        domain: string
        platformId: string
    }): Promise<CustomDomain> {
        const isCloudEdition = system.getEdition() === ApEdition.CLOUD
        return customDomainRepo().save({
            id: apId(),
            domain: request.domain,
            platformId: request.platformId,
            status: isCloudEdition ? CustomDomainStatus.PENDING : CustomDomainStatus.ACTIVE,
        })

    },
    async list({
        request,
        platformId,
    }: ListParams): Promise<SeekPage<CustomDomain>> {
        const decodedCursor = paginationHelper.decodeCursor(request.cursor ?? null)
        const paginator = buildPaginator({
            entity: CustomDomainEntity,
            query: {
                limit: request.limit ?? 10,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = customDomainRepo()
            .createQueryBuilder('custom_domain')
            .where({
                platformId,
            })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<CustomDomain>(data, cursor)
    },
}

type ListParams = {
    platformId: string
    request: ListCustomDomainsRequest
}