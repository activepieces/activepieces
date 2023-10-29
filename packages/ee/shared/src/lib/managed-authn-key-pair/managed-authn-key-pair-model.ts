import { ApId, BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export enum KeyPairAlgorithm {
    RSA = 'RSA',
}

export const ManagedAuthnKeyPair = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    publicKey: Type.String(),

    /* algorithm used to generate this key pair */
    algorithm: Type.Enum(KeyPairAlgorithm),

    /* ID of user who generated this key pair */
    generatedBy: ApId,
})

export type ManagedAuthnKeyPair = Static<typeof ManagedAuthnKeyPair>
