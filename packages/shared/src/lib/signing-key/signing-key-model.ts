import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Static, Type } from '@sinclair/typebox'

export enum KeyAlgorithm {
    RSA = 'RSA',
}

export type SigningKeyId = ApId

export const SigningKey = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    publicKey: Type.String(),
    displayName: Type.String(),
    /* algorithm used to generate this key pair */
    algorithm: Type.Enum(KeyAlgorithm),
})

export type SigningKey = Static<typeof SigningKey>
