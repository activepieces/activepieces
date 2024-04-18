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
import { system, SystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApEnvironment, apId, ErrorCode, isNil, SeekPage } from '@activepieces/shared'

type HostnameDetailsResponse = {
    txtName: string
    txtValue: string
    hostname: string
}

const customDomainRepo =
    databaseConnection.getRepository<CustomDomain>(CustomDomainEntity)

const isCloudEdition = getEdition() === ApEdition.CLOUD && system.getOrThrow(SystemProp.ENVIRONMENT) !== ApEnvironment.TESTING

export const customDomainService = {
    async delete(request: { id: string, platformId: string }): Promise<void> {
        if (isCloudEdition) {
            const customDomain = await customDomainService.getOneByIdOrThrow(request.id)
            const hostnameDetails = await cloudflareHostnameServices.getHostnameDetails(customDomain.domain)
            const domainId = hostnameDetails.data.result[0]?.id
            if (domainId) {
                await cloudflareHostnameServices.delete(hostnameDetails.data.result[0].id)
            }
        }
        await customDomainRepo.delete({
            id: request.id,
            platformId: request.platformId,
        })
    },
    async getOneByIdOrThrow(id: string) {
        const customDomain = await customDomainRepo.findOneBy({
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
    async getDomainValidationData(request: {
        id: string
    }): Promise<HostnameDetailsResponse | null> {
        const customDomain = await customDomainService.getOneByIdOrThrow(request.id)
        const hostnameDetails = await cloudflareHostnameServices.getHostnameDetails(customDomain.domain)
        const record = hostnameDetails.data.result[0]
        if (record.ssl.status === 'initializing') {
            return null
        }
        const validationRecord = record.ssl.validation_records[0]
        return {
            txtName: validationRecord.txt_name,
            txtValue: validationRecord.txt_value,
            hostname: record.hostname,
        }
    },
    async verifyDomain(request: {
        platformId: string
        id: string
    }): Promise<{ status: string }> {
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
        const patchResult = await cloudflareHostnameServices.update(hostnameDetails.data.result[0].id)
        const status = patchResult.data.result.status

        await customDomainRepo.update({
            platformId: request.platformId,
            id: request.id,
        }, {
            status: status !== 'pending' ? CustomDomainStatus.ACTIVE : CustomDomainStatus.PENDING,
        })

        return { status }
    },
    async create(request: {
        domain: string
        platformId: string
    }): Promise<{
            customDomain: CustomDomain
            cloudflareHostnameData: null | HostnameDetailsResponse
        }> {
        const customDomain = await customDomainRepo.save({
            id: apId(),
            domain: request.domain,
            platformId: request.platformId,
            status: isCloudEdition ? CustomDomainStatus.PENDING : CustomDomainStatus.ACTIVE,
        })

        let cloudflareHostnameData: HostnameDetailsResponse | null = null
        if (isCloudEdition) {
            await cloudflareHostnameServices.create(request.domain)
            let retry = 0
            // TODO this is hack to wait to create verification record
            while (!cloudflareHostnameData && retry < 3) {
                cloudflareHostnameData = await customDomainService.getDomainValidationData({
                    id: customDomain.id,
                })
                retry++
                await new Promise((resolve) => setTimeout(resolve, 3000))
            }
        }
        return {
            customDomain,
            cloudflareHostnameData,
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
