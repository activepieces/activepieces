import { ApId, BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'

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
