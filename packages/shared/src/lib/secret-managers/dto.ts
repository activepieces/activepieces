import { Type } from "@sinclair/typebox"
import { Static } from "@sinclair/typebox"
import { DiscriminatedUnion } from "../common"

export const HashicorpProviderConfigSchema = Type.Object({
  url: Type.String(),
  token: Type.String(),
})

export type HashicorpProviderConfig = Static<typeof HashicorpProviderConfigSchema>

export const ConnectSecretManagerRequestSchema = DiscriminatedUnion('providerId', [
  Type.Object({
    providerId: Type.Literal("hashicorp"),
    config: HashicorpProviderConfigSchema,
  }),
])


export type ConnectSecretManagerRequest = Static<typeof ConnectSecretManagerRequestSchema>