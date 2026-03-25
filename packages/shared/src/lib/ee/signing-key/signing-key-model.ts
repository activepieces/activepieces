import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'

export enum KeyAlgorithm {
    RSA = 'RSA',
}

export type SigningKeyId = ApId

export const SigningKey = z.object({
    ...BaseModelSchema,
    platformId: ApId,
    publicKey: z.string(),
    displayName: z.string(),
    /* algorithm used to generate this key pair */
    algorithm: z.nativeEnum(KeyAlgorithm),
})

export type SigningKey = z.infer<typeof SigningKey>
