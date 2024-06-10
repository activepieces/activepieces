import { StatusCodes } from 'http-status-codes'
import { flagService } from '../../flags/flag.service'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ActivateKeyRequestBody, ActivationKeyEntity, ActivationKeyFeatures, ActivationKeyStatus, ActivepiecesError, ApEdition, CreateKeyRequestBody, ErrorCode, GetKeyRequestParams, PieceType, Platform, PlatformRole, turnedOffFeatures, UserStatus } from '@activepieces/shared'
const secretManagerActivationKeysRoute = 'https://b1d8-2a00-18d0-5-b9e5-1c7c-fd6b-a1c4-ade2.ngrok-free.app/activation-keys'
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
        handleUnexpectedSecretsManagerError(errorMessage)
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
        handleUnexpectedSecretsManagerError(errorMessage)
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
        handleUnexpectedSecretsManagerError(errorMessage)
    }

    const key: ActivationKeyEntity = await response.json()
    const oldesetPlatform = await platformService.getOldestPlatform()
    if (oldesetPlatform) {
        await platformService.update({ id: oldesetPlatform.id, activationKey: key.key })
        await applyKeyToPlatform(oldesetPlatform, key.features, key.key)
        return key
    }
    else {
        throw new Error('Trying to activate a key when there is no platform created')
    }
}

const handleUnexpectedSecretsManagerError = (message: string)=> {
    logger.error(`[ERROR]: Unexpected error from secret manager: ${message}`)
    throw new Error(message)

}

type VerificationResult = {
    valid: true
    key: ActivationKeyEntity
} |
{
    valid: false
    key: ActivationKeyEntity | undefined
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

const verifyActivationKeyAndUpdatePlatform: (key: string, platform: Platform) => Promise<Platform> = async (key: string, platform: Platform) => {
    const verificationResult = await activationKeysService.verifyKey({ key })
    if (!verificationResult.valid) {
        logger.error(`[ERROR]: License key provided is invalid, turning off enterprise features:${key}`)
        return deactivateKey(platform, key)
    }
    logger.debug('License key provided is valid, turning on enterprise features.')
    try {
        await  activateKey({ key })
    }
    catch (err) {
        if (!(err instanceof ActivepiecesError) || err.error.code !== ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED) {
            throw err
        }
    }
    return applyKeyToPlatform(platform, verificationResult.key.features, key)
   
}
/**Check license key in env then in platform */
const checkActivationKeyInEnvAndPlatform: () => Promise<Platform | undefined> = async () => {
    const edition = system.getOrThrow<ApEdition>(SystemProp.EDITION)
    if (edition === ApEdition.CLOUD || edition === ApEdition.COMMUNITY) {
        return undefined
    }
    const licenseKeyInEnvironment = system.get(SystemProp.LICENSE_KEY)
    const oldestPlatform = await platformService.getOldestPlatform()
    if (licenseKeyInEnvironment && oldestPlatform) {
        return  verifyActivationKeyAndUpdatePlatform(licenseKeyInEnvironment, oldestPlatform)
    }
    else if (oldestPlatform && oldestPlatform.activationKey) {
        return  verifyActivationKeyAndUpdatePlatform(oldestPlatform.activationKey, oldestPlatform)
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

const deactivateKey: (platform: Platform, activationKey: string) => Promise<Platform> =  async (platform: Platform, activationKey: string) => {

    await deactivatePlatformUsersOtherThanAdmin(platform.id)
    await deletePrivatePieces(platform.id)
    return platformService.update({
        id: platform.id,
        ...turnedOffFeatures,
        activationKey,
    })

}

const getPlatformKeyStatus: (platformId: string) => Promise<ActivationKeyStatus> = async (platformId: string) =>{
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.activationKey) {
        return {
            valid: false,
            isTrial: false,
            expirayDate: undefined,
        }
    }
    const verificationResult = await activationKeysService.verifyKey({ key: platform.activationKey })
    if (verificationResult.valid ) {
        return {
            valid: true,
            isTrial: verificationResult.key.isTrial,
            expirayDate: verificationResult.key.expires_at,
        }
    }
    else if (verificationResult.key) {
        return {
            valid: false,
            isTrial: verificationResult.key.isTrial,
            expirayDate: verificationResult.key.expires_at,
        } 
    }
    return {
        valid: false,
        isTrial: false,
        expirayDate: undefined,
    }
}




export const activationKeysService = {
    getKeyRowOrThrow,
    getKeyRow,
    activateKey,
    createKey,
    verifyKey,
    verifyActivationKeyAndUpdatePlatform,
    checkActivationKeyInEnvAndPlatform,
    getPlatformKeyStatus,
}

const deactivatePlatformUsersOtherThanAdmin: (platformId: string) => Promise<void> = async (platformId: string)=> {
    const { data } = await userService.list({
        platformId,
    })
    const users = data.map(u => {
        if (u.platformRole === PlatformRole.ADMIN) {
            return new Promise<void>((resolve) => resolve())
        }
        logger.debug(`Deactivating user ${u.email}`)
        return userService.update({
            id: u.id,
            status: UserStatus.INACTIVE,
            platformId,
            platformRole: u.platformRole,
        })
    })
    await Promise.all(users)
}


const deletePrivatePieces: (platformId: string) => Promise<void> = async (platformId: string) => {
    const latestRelease = await flagService.getCurrentRelease()
    const pieces = await pieceMetadataService.list({
        edition: ApEdition.ENTERPRISE,
        includeHidden: true,
        release: latestRelease,
        platformId,
    })
    const deletes = pieces.map((piece) => {
        if (piece.pieceType === PieceType.CUSTOM && piece.id) {
            return pieceMetadataService.delete({
                id: piece.id,
                projectId: piece.projectId,
            })
        }
        return new Promise<void>((resolve) => resolve())
    })
    await Promise.all(deletes)
}


const applyKeyToPlatform: (platform: Platform, features: ActivationKeyFeatures, key: string) => Promise<Platform> = async (platform: Platform, features: ActivationKeyFeatures, key: string) => {
    const updatedPlatform = await platformService.update({
        id: platform.id,
        ...features,
        activationKey: key,
    })
    return updatedPlatform
}