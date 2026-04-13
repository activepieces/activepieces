import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getApiUrl, getSocketUrl } from '../../src/lib/config/configs'

const savedContainerType = process.env.AP_CONTAINER_TYPE
const savedFrontendUrl = process.env.AP_FRONTEND_URL

function cleanEnv() {
    delete process.env.AP_CONTAINER_TYPE
    delete process.env.AP_FRONTEND_URL
}

function restoreEnv() {
    if (savedContainerType !== undefined) process.env.AP_CONTAINER_TYPE = savedContainerType
    else delete process.env.AP_CONTAINER_TYPE
    if (savedFrontendUrl !== undefined) process.env.AP_FRONTEND_URL = savedFrontendUrl
    else delete process.env.AP_FRONTEND_URL
}

describe('getApiUrl', () => {
    beforeEach(cleanEnv)
    afterEach(restoreEnv)

    it('returns localhost when CONTAINER_TYPE is WORKER_AND_APP', () => {
        process.env.AP_CONTAINER_TYPE = 'WORKER_AND_APP'
        expect(getApiUrl()).toBe('http://127.0.0.1:3000/api/')
    })

    it('returns FRONTEND_URL/api/ when CONTAINER_TYPE is WORKER (with trailing slash)', () => {
        process.env.AP_CONTAINER_TYPE = 'WORKER'
        process.env.AP_FRONTEND_URL = 'https://app.activepieces.com/'
        expect(getApiUrl()).toBe('https://app.activepieces.com/api/')
    })

    it('returns FRONTEND_URL/api/ when CONTAINER_TYPE is WORKER (without trailing slash)', () => {
        process.env.AP_CONTAINER_TYPE = 'WORKER'
        process.env.AP_FRONTEND_URL = 'https://app.activepieces.com'
        expect(getApiUrl()).toBe('https://app.activepieces.com/api/')
    })
})

describe('getSocketUrl', () => {
    beforeEach(cleanEnv)
    afterEach(restoreEnv)

    it('returns localhost socket for WORKER_AND_APP', () => {
        process.env.AP_CONTAINER_TYPE = 'WORKER_AND_APP'
        expect(getSocketUrl()).toEqual({ url: 'http://127.0.0.1:3000', path: '/api/socket.io' })
    })

    it('returns FRONTEND_URL socket for WORKER', () => {
        process.env.AP_CONTAINER_TYPE = 'WORKER'
        process.env.AP_FRONTEND_URL = 'https://app.activepieces.com/'
        expect(getSocketUrl()).toEqual({ url: 'https://app.activepieces.com', path: '/api/socket.io' })
    })
})
