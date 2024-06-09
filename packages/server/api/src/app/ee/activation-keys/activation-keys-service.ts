import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { SystemProp, logger, system } from '@activepieces/server-shared'
import { ActivateKeyRequestBody, ActivationKeyEntity, ActivepiecesError, ApEdition, CreateKeyRequestBody, ErrorCode, GetKeyRequestParams, Platform, turnedOffFeatures } from '@activepieces/shared'
const secretManagerActivationKeysRoute = 'https://542b-2a00-18d0-5-b9e5-b5da-5255-c53-ce69.ngrok-free.app/activation-keys'
const createKey = async (request: CreateKeyRequestBody): Promise<void> => {
    const response = await fetch(`${secretManagerActivationKeysRoute}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    })
    if (response.status === StatusCodes.CONFLICT) {
        throw new ActivepiecesError({
            code: ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY,
            params: request,
        })
    }

    if (!response.ok) {
        const errorMessage = JSON.stringify(await response.json())
        throw new Error(errorMessage)
    }
    
}
const getKeyRowOrThrow = async (request: GetKeyRequestParams): Promise<ActivationKeyEntity> => {
    const response = await  fetch(`${secretManagerActivationKeysRoute}/${request.key}`)
    if (response.status === 404) {
        throw new ActivepiecesError({
            code: ErrorCode.ACTIVATION_KEY_NOT_FOUND,
            params: request,
        })
    }
    if (!response.ok) {
        const errorMessage = JSON.stringify(await response.json())
        throw new Error(errorMessage)
    }
    return response.json()
}

const getKeyRow = async (request: GetKeyRequestParams): Promise<ActivationKeyEntity | undefined> => {
    try {
        return await getKeyRowOrThrow(request)
    }
    catch (e) {
        if (e instanceof ActivepiecesError && e.error.code === ErrorCode.ACTIVATION_KEY_NOT_FOUND) {
            return undefined
        }
        throw e
    }
    
}
const activateKey = async (request: ActivateKeyRequestBody ): Promise<ActivationKeyEntity> => {
    const response = await fetch(`${secretManagerActivationKeysRoute}/activate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    })
    if (response.status === StatusCodes.CONFLICT) {
        throw new ActivepiecesError({
            code: ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED,
            params: request,
        })
    }
    if (response.status === StatusCodes.NOT_FOUND) {
        throw new ActivepiecesError({
            code: ErrorCode.ACTIVATION_KEY_NOT_FOUND,
            params: request,
        })
    }
    if (!response.ok) {
        const errorMessage = JSON.stringify(await response.json())
        throw new Error(errorMessage)
    }

    const key: ActivationKeyEntity = await response.json()
    const oldesetPlatform = await platformService.getOldestPlatform()
    if (oldesetPlatform) {
        await platformService.update({ id: oldesetPlatform.id, activationKey: key.key })
        await activationKeyCheck()
        return key
    }
    else {
        throw new Error('Trying to activate a key when there is no platform created')
    }
}


type VerificationResult = {
    valid: true
    key: ActivationKeyEntity
} |
{
    valid: false
    key: undefined
}

const verifyKey = async (request: { key: string } ): Promise<VerificationResult> => {
    const response = await fetch(`${secretManagerActivationKeysRoute}/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    })
    if (!response.ok) {
        const errorMessage = JSON.stringify(await response.json())
        throw new Error(errorMessage)
    }
    return response.json()
}

const checkActivationKeyAndUpdatePlatform: (key: string, platform: Platform) => Promise<Platform> = async (key: string, platform: Platform) => {
    const verificationResult = await activationKeysService.verifyKey({ key })
    if (!verificationResult.valid) {
        logger.error(`[ERROR]: License key provided is invalid, turning off enterprise features:${key}`)
        return platformService.update({
            id: platform.id,
            activationKey: key,
            ...turnedOffFeatures,
        })
        
    }
    const turnedOnFeatures = verificationResult.key.features
    logger.debug('License key provided is valid, turning on enterprise features.')
    return  platformService.update({
        id: platform.id,
        activationKey: key,
        ...turnedOnFeatures,
    })
}
/**Check license key in env then in platform */
const activationKeyCheck: () => Promise<Platform | undefined> = async () => {
    const edition = system.getOrThrow<ApEdition>(SystemProp.EDITION)
    if (edition === ApEdition.CLOUD || edition === ApEdition.COMMUNITY) {
        return undefined
    }
    const licenseKeyInEnvironment = system.get(SystemProp.LICENSE_KEY)
    const oldestPlatform = await platformService.getOldestPlatform()
    if (licenseKeyInEnvironment && oldestPlatform) {
        return  checkActivationKeyAndUpdatePlatform(licenseKeyInEnvironment, oldestPlatform)
    }
    else if (oldestPlatform && oldestPlatform.activationKey) {
        return  checkActivationKeyAndUpdatePlatform(oldestPlatform.activationKey, oldestPlatform)
    }
    else if (oldestPlatform) {
        logger.warn('No license key found, turning off enterprise features.')
        return platformService.update({
            id: oldestPlatform.id,
            ...turnedOffFeatures,
        })
    }
    
    if (oldestPlatform) {
        logger.warn('[WARN]: No license key found while trying to activate liscense key.')
    }
    else {
        logger.warn('[WARN]: Dealying key activation until platform is created.')
    }
    return undefined
}


export const activationKeysService = {
    getKeyRowOrThrow,
    getKeyRow,
    activateKey,
    createKey,
    verifyKey,
    checkActivationKeyAndUpdatePlatform,
    activationKeyCheck
}