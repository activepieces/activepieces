import axios, { AxiosResponse } from 'axios'
import { system, SystemProp } from '@activepieces/server-shared'

export const cloudflareHostnameServices = {
    headers: {
        'X-Auth-Email': system.get(SystemProp.CLOUDFLARE_AUTH_EMAIL),
        'X-Auth-Key': system.get(SystemProp.CLOUDFLARE_API_KEY),
        'Content-Type': 'application/json',
    },
    makeUrl(customHostnameId?: string): string {
        const BASE_URL = `https://api.cloudflare.com/client/v4/zones/${system.get(SystemProp.CLOUDFLARE_ZONE_ID)}/custom_hostnames`
        if (customHostnameId) {
            return `${BASE_URL}/${customHostnameId}`
        }
        return BASE_URL
    },
    async create(hostname: string): Promise<AxiosResponse> {
        return axios.post(
            this.makeUrl(),
            {
                hostname,
                ssl: {
                    bundleMethod: 'ubiquitous',
                    certificateAuthority: 'lets_encrypt',
                    method: 'txt',
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
            },
            {
                headers: this.headers,
            },
        )
    },
    async getHostnameDetails(hostname: string): Promise<AxiosResponse> {
        return axios.get(this.makeUrl(), {
            params: {
                hostname,
            },
            headers: this.headers,
        })
    },
    async getAllHostnames(queryParams?: {
        [key: string]: string
    }): Promise<AxiosResponse> {
        return axios.get(this.makeUrl(), {
            params: queryParams,
            headers: this.headers,
        })
    },
    async update(
        customHostnameId: string,
    ): Promise<AxiosResponse> {
        return axios.patch(this.makeUrl(customHostnameId), {}, {
            headers: this.headers,
        })
    },
    async delete(customHostnameId: string): Promise<AxiosResponse> {
        return axios.delete(this.makeUrl(customHostnameId), {
            headers: this.headers,
        })
    },
}
