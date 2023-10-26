import { CustomDomain, CustomDomainStatus, ListCustomDomainsRequest } from '@activepieces/ee-shared'
import { databaseConnection } from '../../database/database-connection'
import { CustomDomainEntity } from './custom-domain.entity'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import * as dns from 'dns'
import { ActivepiecesError, ErrorCode, apId, isNil } from '@activepieces/shared'
import { logger } from '../../helper/logger'

const customDomainRepo = databaseConnection.getRepository<CustomDomain>(CustomDomainEntity)

export const customDomainService = {
    async delete(request: { id: string, platformId: string }): Promise<void> {
        await customDomainRepo.delete({
            id: request.id,
            platformId: request.platformId,
        })
    },
    async getOneByDomain(request: { domain: string }): Promise<CustomDomain | null> {
        return customDomainRepo.findOneBy({
            domain: request.domain,
        })
    },
    async create(request: { domain: string, platformId: string }) {
        const customDomain = customDomainRepo.create({
            id: apId(),
            domain: request.domain,
            platformId: request.platformId,
            status: CustomDomainStatus.PENDING,
        })
        return customDomainRepo.save(customDomain)
    },
    async list({ request, platformId }: { platformId: string, request: ListCustomDomainsRequest }) {
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
        return paginationHelper.createPage<CustomDomain>(
            data,
            cursor,
        )
    },
    async check(request: { id: string, platformId: string }): Promise<CustomDomain> {
        const customDomain = await customDomainRepo.findOneBy({
            id: request.id,
            platformId: request.platformId,
        })
        if (isNil(customDomain)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Custom doman with id ${request.id} not found`,
                },
            })
        }
        const cnameExists = await verifyCnameExists(customDomain.domain)
        await customDomainRepo.update({
            id: request.id,
        }, {
            status: cnameExists ? CustomDomainStatus.ACTIVE : CustomDomainStatus.PENDING,
        })
        return customDomainRepo.findOneByOrFail({
            id: customDomain.id,
        })
    },
}

async function verifyCnameExists(domain: string): Promise<boolean> {
    try {
        const cnameRecords = await dns.promises.resolveCname(domain)
        logger.info(`CNAME records for ${domain}: ${cnameRecords}`)
        return cnameRecords.length > 0 && ['cloud.activepieces.com', 'customers.activepieces.com'].includes(cnameRecords[0])
    }
    catch (error) {
        logger.info(`CNAME records for ${domain} errors out: ${error}`)
        return false
    }
}
