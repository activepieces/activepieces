import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";
import { ApId } from "../common/id-generator";

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
})

export type SigningKey = Static<typeof SigningKey>
