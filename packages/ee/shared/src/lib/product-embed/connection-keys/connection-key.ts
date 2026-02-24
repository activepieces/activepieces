import { ProjectId } from '@activepieces/shared'

export type ConnectionKeyId = string

export type ConnectionKey = {
    id: ConnectionKeyId
    created: string
    updated: string
    projectId: ProjectId
    settings: SigningKeyConnection
}

export type SigningKeyConnection = {
    type: ConnectionKeyType.SIGNING_KEY
    publicKey: string
    privateKey?: string
}

export enum ConnectionKeyType {
    SIGNING_KEY = 'SIGNING_KEY',
}
