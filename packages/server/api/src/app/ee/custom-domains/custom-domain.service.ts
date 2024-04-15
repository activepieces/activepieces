import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { cloudflareHostnameServices } from './cloudflare-api.service'
import { CustomDomainEntity } from './custom-domain.entity'
import {
    CustomDomain,
    CustomDomainStatus,
    ListCustomDomainsRequest,
} from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, apId, ErrorCode, SeekPage } from '@activepieces/shared'

export type SSLParams = {
    bundleMethod: 'ubiquitous' | 'optimal' | 'force'
    certificateAuthority: 'lets_encrypt'
    customCertificate: string
    customKey: string
    method: 'txt'
}

const customDomainRepo =
    databaseConnection.getRepository<CustomDomain>(CustomDomainEntity)

export const customDomainService = {
    async delete(request: { id: string, platformId: string }): Promise<void> {
        try {
            const customDomain = await customDomainRepo
                .createQueryBuilder('custom_domain')
                .where({
                    id: request.id,
                })
                .getRawOne()

            const hostnameDetails = await cloudflareHostnameServices.getHostnameDetails(customDomain.custom_domain_domain)

            if (hostnameDetails.data.result.id) {
                await cloudflareHostnameServices.delete(hostnameDetails.data.result.id)
                await customDomainRepo.delete({
                    id: request.id,
                    platformId: request.platformId,
                })
            }
        }
        catch (e) {
            logger.error(e)
            throw new ActivepiecesError({
                code: ErrorCode.CUSTOM_DOMAIN_FAILED,
                params: {
                    message: 'Failed to delete custom domain.',
                },
            })
        }
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
    async verifyDomain(request: {
        platformId: string
        id: string
    }): Promise<boolean> {
        const customDomain = await customDomainRepo
            .createQueryBuilder('custom_domain')
            .where({
                id: request.id,
            })
            .getRawOne()
        const hostnameDetails = await cloudflareHostnameServices.getHostnameDetails(customDomain.custom_domain_domain)
        const patchResult = await cloudflareHostnameServices.update(hostnameDetails.data.result.id)
        const status = patchResult.data.result.status

        await customDomainRepo.update({
            platformId: request.platformId,
            id: request.id,
        }, {
            status: CustomDomainStatus.ACTIVE,
        })

        return status
    },
    async create(request: {
        domain: string
        platformId: string
        ssl: SSLParams
    }): Promise<CustomDomain> {
        try {
            const customDomain = customDomainRepo.create({
                id: apId(),
                domain: request.domain, 
                platformId: request.platformId,
                status: CustomDomainStatus.PENDING,
            })
            
            await cloudflareHostnameServices.create({ 
                hostname: request.domain, 
                ssl: request.ssl, 
            })

            return await customDomainRepo.save(customDomain)
        }
        catch (e) {
            logger.error(e)
            throw new ActivepiecesError({
                code: ErrorCode.CUSTOM_DOMAIN_FAILED,
                params: {
                    message: 'Failed to create a custom domain. Make sure you are not using domains like *.example.com and *.example.net.',
                },
            })
        }
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
