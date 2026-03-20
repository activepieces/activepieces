export const MOCK_VAULT_URL = 'http://mock-vault:8200'
export const MOCK_ROLE_ID = 'mock-role-id'
export const MOCK_SECRET_ID = 'mock-secret-id'
export const MOCK_VAULT_TOKEN = 'mock-vault-token'

export const mockVaultConfig = {
    url: MOCK_VAULT_URL,
    roleId: MOCK_ROLE_ID,
    secretId: MOCK_SECRET_ID,
}

import { MockInstance } from 'vitest'

export const hashicorpMock = (axiosRequestSpy: MockInstance) => ({
    mockVaultLoginSuccess: () => {
        axiosRequestSpy.mockImplementation(async (config: { url: string, method: string }) => {
            if (config.url.includes('/v1/auth/approle/login') && config.method === 'POST') {
                return {
                    data: {
                        auth: {
                            client_token: MOCK_VAULT_TOKEN,
                        },
                    },
                }
            }
            if (config.url.includes('/v1/sys/mounts') && config.method === 'GET') {
                return {
                    data: {
                        'secret/': { type: 'kv', options: { version: '2' } },
                    },
                }
            }
            throw new Error(`Unexpected request: ${config.method} ${config.url}`)
        })
    },

    mockVaultLoginFailure: () => {
        axiosRequestSpy.mockImplementation(async (config: { url: string, method: string }) => {
            if (config.url.includes('/v1/auth/approle/login')) {
                throw new Error('permission denied')
            }
            throw new Error(`Unexpected request: ${config.method} ${config.url}`)
        })
    },

    mockVaultGetSecretSuccess: (secretData: Record<string, string>) => {
        axiosRequestSpy.mockImplementation(async (config: { url: string, method: string }) => {
            if (config.url.includes('/v1/auth/approle/login') && config.method === 'POST') {
                return {
                    data: {
                        auth: {
                            client_token: MOCK_VAULT_TOKEN,
                        },
                    },
                }
            }
            if (config.url.includes('/v1/sys/mounts') && config.method === 'GET') {
                return {
                    data: {
                        'secret/': { type: 'kv', options: { version: '2' } },
                    },
                }
            }
            if (config.method === 'GET') {
                return {
                    data: {
                        data: {
                            data: secretData,
                        },
                    },
                }
            }
            throw new Error(`Unexpected request: ${config.method} ${config.url}`)
        })
    },

    mockVaultGetSecretNotFound: () => {
        axiosRequestSpy.mockImplementation(async (config: { url: string, method: string }) => {
            if (config.url.includes('/v1/auth/approle/login') && config.method === 'POST') {
                return {
                    data: {
                        auth: {
                            client_token: MOCK_VAULT_TOKEN,
                        },
                    },
                }
            }
            if (config.url.includes('/v1/sys/mounts') && config.method === 'GET') {
                return {
                    data: {
                        'secret/': { type: 'kv', options: { version: '2' } },
                    },
                }
            }
            if (config.method === 'GET') {
                throw new Error('secret not found')
            }
            throw new Error(`Unexpected request: ${config.method} ${config.url}`)
        })
    },
})
