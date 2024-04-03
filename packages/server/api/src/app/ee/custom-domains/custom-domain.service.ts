import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { CustomDomainEntity } from './custom-domain.entity'
import {
    CustomDomain,
    CustomDomainStatus,
    ListCustomDomainsRequest,
} from '@activepieces/ee-shared'
import { apId, SeekPage } from '@activepieces/shared'

const customDomainRepo =
  databaseConnection.getRepository<CustomDomain>(CustomDomainEntity)

export const customDomainService = {
    async delete(request: { id: string, platformId: string }): Promise<void> {
        await customDomainRepo.delete({
            id: request.id,
            platformId: request.platformId,
        })
    },
    async getOneByDomain(request: {
        domain: string
    }): Promise<CustomDomain | null> {
        return customDomainRepo.findOneBy({
            domain: request.domain,
        })
    },
    async getOneByPlatform(request: {
        platformId: string
    }): Promise<CustomDomain | null> {
        return customDomainRepo.findOneBy({
            platformId: request.platformId,
        })
    },
    async create(request: {
        domain: string
        platformId: string
    }): Promise<CustomDomain> {
        const customDomain = customDomainRepo.create({
            id: apId(),
            domain: request.domain,
            platformId: request.platformId,
            status: CustomDomainStatus.ACTIVE,
        })
        return customDomainRepo.save(customDomain)
    },
    async list({
        request,
        platformId,
    }: {
        platformId: string
        request: ListCustomDomainsRequest
    }): Promise<SeekPage<CustomDomain>> {
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
        const queryBuilder = customDomainRepo
            .createQueryBuilder('custom_domain')
            .where({
                platformId,
            })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<CustomDomain>(data, cursor)
    },
}
