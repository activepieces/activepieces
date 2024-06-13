import { StatusCodes } from 'http-status-codes'
import { flagService } from '../../flags/flag.service'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, CreateTrialLicenseKeyRequestBody, ErrorCode, LicenseKeyEntity, LicenseKeyFeatures, LicenseKeyStatus, PieceType, Platform, PlatformRole, turnedOffFeatures, UserStatus } from '@activepieces/shared'
const secretManagerLicenseKeysRoute = 'https://secrets.activepieces.com/license-keys'
const createKey = async (request: CreateTrialLicenseKeyRequestBody): Promise<void> => {
    const response = await fetch(`${secretManagerLicenseKeysRoute}`, {
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

const activateKey: (request: { key: string }) => Promise<LicenseKeyEntity>  = async (request ) => {
    const response = await fetch(`${secretManagerLicenseKeysRoute}/activate`, {
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

    const key: LicenseKeyEntity = await response.json()
    const oldesetPlatform = await platformService.getOldestPlatform()
    if (oldesetPlatform) {
        await applyKeyToPlatform(oldesetPlatform.id, key.features)
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
    key: LicenseKeyEntity
} |
{
    valid: false
    key?: LicenseKeyEntity
}

const verifyKey = async (request: { key: string } ): Promise<VerificationResult> => {
    const response = await fetch(`${secretManagerLicenseKeysRoute}/verify`, {
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

const verifyKeyAndUpdatePlatform: (req: { key: string, platformId: string, throwErrorOnFailure?: boolean }) => Promise<Platform> = async ({ key, platformId, throwErrorOnFailure }) => {
    try {
        await  activateKey({ key })
    }
    catch (err) {
        //  ABDUL TODO: Discuss unknown errors with MO 
        if ((err instanceof ActivepiecesError) &&  err.error.code !== ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED) {
            throw err
        }
    }

    try {
        const verificationResult = await verifyKey({ key })
        if (!verificationResult.valid) {
            if (throwErrorOnFailure) {
                throw new Error(`[ERROR]: License key provided is invalid, key: ${key}`)
            }
            logger.error(`[ERROR]: License key provided is invalid, turning off enterprise features:${key}`)
            return await deactivateKey(platformId)
        }
        logger.debug('License key provided is valid, turning on enterprise features.')
       
        return await applyKeyToPlatform(platformId, verificationResult.key.features)
    }
    catch (err) {
        //  ABDUL TODO: Discuss unknown errors with MO 
        logger.error(`[ERROR]: Error verifying license key: ${err}`)   
        return (await platformService.getOldestPlatform())! 
    }
}
/**Check license key in env then in platform */
const checkKeyStatus: (throwErrorOnInvalid?: boolean) => Promise<Platform | undefined> = async (throwErrorOnInvalid) => {
    const edition = system.getOrThrow<ApEdition>(SystemProp.EDITION)
    if (edition === ApEdition.CLOUD || edition === ApEdition.COMMUNITY) {
        return undefined
    }
    const licenseKeyInEnvironment = system.getOrThrow(SystemProp.LICENSE_KEY)
    const oldestPlatform = await platformService.getOldestPlatform()
    if (licenseKeyInEnvironment && oldestPlatform) {
        return verifyKeyAndUpdatePlatform({
            key: licenseKeyInEnvironment, platformId: oldestPlatform.id, throwErrorOnFailure: throwErrorOnInvalid,
        })
    }
    else if (!oldestPlatform) {
        logger.warn('[WARN]: Dealying license key activation until platform is created.')
    }
   
    return undefined
}

const deactivateKey: (platformId: string) => Promise<Platform> =  async (platformId: string) => {

    await deactivatePlatformUsersOtherThanAdmin(platformId)
    await deletePrivatePieces(platformId)
    return platformService.update({
        id: platformId,
        ...turnedOffFeatures,
    })

}

const getKeyStatus: () => Promise<LicenseKeyStatus> = async () =>{
    const licenseKeyInEnvironment = system.get(SystemProp.LICENSE_KEY)
    if (!licenseKeyInEnvironment) {
        return {
            valid: false,
            isTrial: false,
            expirayDate: undefined,
        }
    }
    const verificationResult = await verifyKey({ key: licenseKeyInEnvironment })
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




export const licenseKeysService = {
    activateKey,
    createKey,
    verifyKeyAndUpdatePlatform,
    checkKeyStatus,
    getKeyStatus,
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


const applyKeyToPlatform: (platformId: string, features: LicenseKeyFeatures) => Promise<Platform> = async (platformId: string, features: LicenseKeyFeatures) => {
    const updatedPlatform = await platformService.update({
        id: platformId,
        ...features,
    })
    return updatedPlatform
}