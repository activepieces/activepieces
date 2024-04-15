import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { getEdition } from '../../helper/secret-helper'
import { cloudflareHostnameServices } from './cloudflare-api.service'
import { CustomDomainEntity } from './custom-domain.entity'
import {
    CustomDomain,
    CustomDomainStatus,
    ListCustomDomainsRequest,
} from '@activepieces/ee-shared'
import { ActivepiecesError, ApEdition, apId, ErrorCode, isNil, SeekPage } from '@activepieces/shared'

const customDomainRepo =
    databaseConnection.getRepository<CustomDomain>(CustomDomainEntity)

export const customDomainService = {
    async delete(request: { id: string, platformId: string }): Promise<void> {
        const edition = getEdition()
        if (edition === ApEdition.CLOUD) {
            const customDomain = await customDomainRepo.findOneBy({
                id: request.id,
            })

            if (isNil(customDomain)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityType: 'CustomDomain',
                        entityId: request.id,
                    },
                })
            }
                
            const hostnameDetails = await cloudflareHostnameServices.getHostnameDetails(customDomain.domain)
            if (hostnameDetails.data.result.id) {
                await cloudflareHostnameServices.delete(hostnameDetails.data.result.id)
            }
        }
            
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
    async verifyDomain(request: {
        platformId: string
        id: string
    }): Promise<boolean> {
        const customDomain = await customDomainRepo.findOneBy({
            id: request.id,
        })

        if (isNil(customDomain)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'CustomDomain',
                    entityId: request.id,
                },
            })
        }

        const hostnameDetails = await cloudflareHostnameServices.getHostnameDetails(customDomain.domain)
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
    }): Promise<CustomDomain> {
        const customDomain = customDomainRepo.create({
            id: apId(),
            domain: request.domain, 
            platformId: request.platformId,
            status: CustomDomainStatus.PENDING,
        })
        
        const edition = getEdition()
        if (edition === ApEdition.CLOUD) {
            await cloudflareHostnameServices.create({ 
                hostname: request.domain, 
            })
        }

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
