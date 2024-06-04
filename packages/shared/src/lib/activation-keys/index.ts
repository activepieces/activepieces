import { Static, Type } from '@sinclair/typebox'
import { ALL_PRINCIPAL_TYPES, PrincipalType } from '../authentication/model/principal-type'
import { spreadIfDefined } from '../common'

export const ActivateKeyRequestBody = Type.Object({
    key: Type.String(),
})

export type ActivateKeyRequestBody = Static<typeof ActivateKeyRequestBody>

export const CreateKeyRequestBody = Type.Object({
    email: Type.String(),
})

export type CreateKeyRequestBody = Static<typeof CreateKeyRequestBody>

export type ActivationKeyEntity = {
    id: string
    expires_at: string
    email: string
    activated_at: string
    created_at: string
    key: string
}

const GetKeyRequestParams =  Type.Object({
    key: Type.String(),
})

export type GetKeyRequestParams = Static<typeof GetKeyRequestParams>
export const GetKeyRequest = ({ withCredentials }: { withCredentials: boolean }) => {
    const request = {
        ...spreadIfDefined('config', configCreator(withCredentials)),
        schema: {
            params: GetKeyRequestParams,
        },
    }
    return request
}



export const CreateKeyRequest = ({ withCredentials }: { withCredentials: boolean }) => {
  
    const request =  {
        ...spreadIfDefined('config', configCreator(withCredentials)),
        schema: {
            body: CreateKeyRequestBody,
        },
    }
    return request
}
export const ActivateKeyRequest = ({ withCredentials }: { withCredentials: boolean }) => {
    const request =  {
        ...spreadIfDefined('config', configCreator(withCredentials)),
        schema: {
            body: ActivateKeyRequestBody,
        },
    }
    return request
}


const configCreator = ( withCredentials: boolean) => {
    return withCredentials ? { allowedPrincipals: [
        PrincipalType.USER,
    ] } : { allowedPrincipals: ALL_PRINCIPAL_TYPES }
}