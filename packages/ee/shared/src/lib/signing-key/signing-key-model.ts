import { ApId, BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

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
    /* ID of user who generated this key pair */
    generatedBy: ApId,
    generatedByEmail: Type.String({
        format: 'email',
    }),
})

export type SigningKey = Static<typeof SigningKey>
