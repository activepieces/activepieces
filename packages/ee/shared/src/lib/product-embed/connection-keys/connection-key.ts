import { BaseModel, ProjectId } from '@activepieces/shared'

export type ConnectionKeyId = string

export type ConnectionKey = {
    projectId: ProjectId
    settings: SigningKeyConnection
} & BaseModel<ConnectionKeyId>

export type SigningKeyConnection = {
    type: ConnectionKeyType.SIGNING_KEY
    publicKey: string
    privateKey?: string
}

export enum ConnectionKeyType {
    SIGNING_KEY = 'SIGNING_KEY',
}
