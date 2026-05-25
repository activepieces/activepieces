/**
 * Experiment: stable-engine-response-server-id
 *
 * Retain B side: delete each BEGIN/END "A side" section in this file.
 * Retain A side: delete each BEGIN/END "B side" section in this file.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppSystemProp } from '@api/helper/system/system-props'

const getBooleanMock = vi.fn()
const getMock = vi.fn()
const getOrThrowMock = vi.fn()

vi.mock('@api/helper/system/system', () => ({
    system: {
        getBoolean: getBooleanMock,
        get: getMock,
        getOrThrow: getOrThrowMock,
    },
}))

const ENGINE_RESPONSE_SERVER_ID_MODULE = '@api/workers/engine-response-server-id'

const savedEnv = {
    stableFlag: process.env.AP_STABLE_ENGINE_RESPONSE_SERVER_ID_ENABLED,
    engineResponseServerId: process.env.AP_ENGINE_RESPONSE_SERVER_ID,
    containerType: process.env.AP_CONTAINER_TYPE,
    encryptionKey: process.env.AP_ENCRYPTION_KEY,
}

async function loadEngineResponseServerIdModule() {
    vi.resetModules()
    return import(ENGINE_RESPONSE_SERVER_ID_MODULE)
}

function restoreExperimentEnv(): void {
    if (savedEnv.stableFlag === undefined) {
        delete process.env.AP_STABLE_ENGINE_RESPONSE_SERVER_ID_ENABLED
    }
    else {
        process.env.AP_STABLE_ENGINE_RESPONSE_SERVER_ID_ENABLED = savedEnv.stableFlag
    }
    if (savedEnv.engineResponseServerId === undefined) {
        delete process.env.AP_ENGINE_RESPONSE_SERVER_ID
    }
    else {
        process.env.AP_ENGINE_RESPONSE_SERVER_ID = savedEnv.engineResponseServerId
    }
    if (savedEnv.containerType === undefined) {
        delete process.env.AP_CONTAINER_TYPE
    }
    else {
        process.env.AP_CONTAINER_TYPE = savedEnv.containerType
    }
    if (savedEnv.encryptionKey === undefined) {
        delete process.env.AP_ENCRYPTION_KEY
    }
    else {
        process.env.AP_ENCRYPTION_KEY = savedEnv.encryptionKey
    }
}

function resetServerIdMocks(): void {
    getBooleanMock.mockClear()
    getMock.mockClear()
    getOrThrowMock.mockClear()
    getOrThrowMock.mockReturnValue('7e19fad4c13eaea8f657afb12e8f9c40')
    getMock.mockReturnValue(undefined)
    getBooleanMock.mockReturnValue(undefined)
}

// BEGIN stable-engine-response-server-id A side (delete this section if experiment retains B side)
describe('engine-response-server-id A side', () => {
    beforeEach(() => {
        resetServerIdMocks()
        getBooleanMock.mockReturnValue(false)
    })

    afterEach(() => {
        vi.resetModules()
        restoreExperimentEnv()
    })

    it('should generate different ids across separate APP and WORKER process module loads', async () => {
        process.env.AP_CONTAINER_TYPE = 'APP'
        const appModule = await loadEngineResponseServerIdModule()
        const appId = appModule.getEngineResponseServerId()

        process.env.AP_CONTAINER_TYPE = 'WORKER'
        const workerModule = await loadEngineResponseServerIdModule()
        const workerId = workerModule.getEngineResponseServerId()

        expect(appId, 'APP process must not share random server id with WORKER process').not.toBe(workerId)
    })
})
// END stable-engine-response-server-id A side

// BEGIN stable-engine-response-server-id B side (delete this section if experiment retains A side)
describe('engine-response-server-id B side', () => {
    beforeEach(() => {
        resetServerIdMocks()
        getBooleanMock.mockReturnValue(true)
    })

    afterEach(() => {
        vi.resetModules()
        restoreExperimentEnv()
    })

    it('should derive the same stable id for APP and WORKER processes from encryption key', async () => {
        process.env.AP_CONTAINER_TYPE = 'APP'
        const appModule = await loadEngineResponseServerIdModule()
        const appId = appModule.getEngineResponseServerId()

        process.env.AP_CONTAINER_TYPE = 'WORKER'
        const workerModule = await loadEngineResponseServerIdModule()
        const workerId = workerModule.getEngineResponseServerId()

        expect(appId, 'APP and WORKER must share stable engine response server id').toBe(workerId)
        expect(appId, 'stable id must be 21 characters like apId').toHaveLength(21)
    })

    it('should prefer AP_ENGINE_RESPONSE_SERVER_ID when configured', async () => {
        const configuredId = 'StableSharedServerId0'
        getMock.mockImplementation((prop: AppSystemProp) => {
            if (prop === AppSystemProp.ENGINE_RESPONSE_SERVER_ID) {
                return configuredId
            }
            return undefined
        })

        const appModule = await loadEngineResponseServerIdModule()
        const workerModule = await loadEngineResponseServerIdModule()

        expect(appModule.getEngineResponseServerId(), 'explicit server id must be used on APP').toBe(configuredId)
        expect(workerModule.getEngineResponseServerId(), 'explicit server id must be used on WORKER').toBe(configuredId)
    })

    it('should reject AP_ENGINE_RESPONSE_SERVER_ID when it is not a valid ApId', async () => {
        getMock.mockImplementation((prop: AppSystemProp) => {
            if (prop === AppSystemProp.ENGINE_RESPONSE_SERVER_ID) {
                return 'invalid-server-id'
            }
            return undefined
        })

        const module = await loadEngineResponseServerIdModule()

        expect(
            () => module.getEngineResponseServerId(),
            'misconfigured engine response server id must fail ApId validation at startup',
        ).toThrow()
    })
})
// END stable-engine-response-server-id B side
