import { StatusCodes } from 'http-status-codes'
import { ActivateKeyRequestBody, ActivationKeyEntity, ActivepiecesError, CreateKeyRequestBody, ErrorCode, GetKeyRequestParams } from '@activepieces/shared'
const cloudActivationKeysRoute = 'https://cloud.activepieces.com/api/v1/activation-keys'
const createKey = async (request: CreateKeyRequestBody): Promise<ActivationKeyEntity> => {
    const response = await fetch(`${cloudActivationKeysRoute}`, {
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
    return response.json()
}
const getKey = async (request: GetKeyRequestParams): Promise<ActivationKeyEntity> => {
    const response = await  fetch(`${cloudActivationKeysRoute}/${request.key}`)
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
    const response = await fetch(`${cloudActivationKeysRoute}/activate`, {
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
    if (!response.ok) {
        const errorMessage = JSON.stringify(await response.json())
        throw new Error(errorMessage)
    }
    return response.json()
}

export const clientActivationKeyService = {
    getKey,
    activateKey,
    createKey,
}