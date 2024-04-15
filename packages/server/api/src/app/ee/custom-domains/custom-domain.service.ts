import axios, { AxiosResponse } from 'axios'
import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
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
    certificateAuthority: 'digicert' | 'google' | 'lets_encrypt'
    customCertificate: string
    customKey: string
    method: 'http' | 'txt' | 'email'
}

const customDomainRepo =
    databaseConnection.getRepository<CustomDomain>(CustomDomainEntity)

const cloudflareApi = {
    headers: {
        'X-Auth-Email': process.env.AUTH_EMAIL,
        'X-Auth-Key': process.env.AP_API_KEY,
        'Content-Type': 'application/json',
    },
    makeUrl(customHostnameId?: string): string {
        const BASE_URL = `https://api.cloudflare.com/client/v4/zones/${process.env.ZONE_ID}/custom_hostnames`
        if (customHostnameId) {
            return `${BASE_URL}/${customHostnameId}`
        }
        return BASE_URL
    },
    async createCustomHostname(request: {
        hostname: string
        ssl: SSLParams
    }): Promise<AxiosResponse> {
        return axios.post(this.makeUrl(), {
            hostname: request.hostname,
            ssl: {
                ...request.ssl,
                settings: {
                    ciphers: ['ECDHE-RSA-AES128-GCM-SHA256', 'AES128-SHA'],
                    early_hints: 'on',
                    http2: 'on',
                    min_tls_version: '1.2',
                    tls_1_3: 'on',
                },
                type: 'dv', 
                wildcard: false,
            },
        }, {
            headers: this.headers,
        })
    },
    async customHostnameDetails(hostname: string): Promise<AxiosResponse> {
        return axios.get(this.makeUrl(), {
            params: {
                hostname,
            },
            headers: this.headers,
        })
    },
    async listCustomHostnames(queryParams?: { [key: string]: string }): Promise<AxiosResponse> {
        return axios.get(this.makeUrl(), {
            params: queryParams,
            headers: this.headers,
        })
    },
    async patchCustomHostname(
        customHostnameId: string, 
        data?: { 
            ssl: SSLParams 
        },
    ): Promise<AxiosResponse> {
        let body = {}
        if (data) {
            body = data
        }
        return axios.patch(this.makeUrl(customHostnameId), body, { headers: this.headers })
    },
    async deleteCustomHostname(customHostnameId: string): Promise<AxiosResponse> {
        return axios.delete(this.makeUrl(customHostnameId), { headers: this.headers })
    },
}

export const customDomainService = {
    async delete(request: { id: string, platformId: string }): Promise<void> {
        try {
            const customDomain = await customDomainRepo
                .createQueryBuilder('custom_domain')
                .where({
                    id: request.id,
                })
                .getRawOne()

            const hostnameDetails = await cloudflareApi.customHostnameDetails(customDomain.custom_domain_domain)

            if (hostnameDetails.data.result.id) {
                await cloudflareApi.deleteCustomHostname(hostnameDetails.data.result.id)
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
        const hostnameDetails = await cloudflareApi.customHostnameDetails(customDomain.custom_domain_domain)
        const patchResult = await cloudflareApi.patchCustomHostname(hostnameDetails.data.result.id)
        const status = patchResult.data.result.status

        await customDomainRepo.update({
            platformId: request.platformId,
            id: request.id,
        }, {
            status,
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
            
            await cloudflareApi.createCustomHostname({ 
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
