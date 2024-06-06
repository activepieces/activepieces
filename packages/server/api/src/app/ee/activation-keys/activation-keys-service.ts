import { StatusCodes } from 'http-status-codes'
import { ActivateKeyRequestBody, ActivationKeyEntity, ActivepiecesError, CreateKeyRequestBody, ErrorCode, GetKeyRequestParams } from '@activepieces/shared'
const secretManagerActivationKeysRoute = 'https://5674-109-237-199-55.ngrok-free.app/activation-keys'
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
const getKeyRow = async (request: GetKeyRequestParams): Promise<ActivationKeyEntity> => {
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
    return response.json()
}


const verifyKey = async (request: {key: string} ): Promise<{valid:boolean, isTrial:boolean, key:ActivationKeyEntity}> => {
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

export const activationKeysService = {
    getKeyRow,
    activateKey,
    createKey,
    verifyKey
}