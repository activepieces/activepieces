import { Type, Static } from '@sinclair/typebox'
import { BaseModelSchema } from '../common/base-model'
import { DiscriminatedUnion } from '../common'
import { HashicorpProviderConfigSchema } from './dto'

export * from './dto'

export const SecretManagerEntitySchema = Type.Object({
  ...BaseModelSchema,
  platformId: Type.String(),
  providerId: Type.String(),
  auth: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
})

export type SecretManager = Static<typeof SecretManagerEntitySchema>

export const SecretManagerFieldSchema =  Type.Object({
  displayName: Type.String(),
  placeholder: Type.String(),
})

export enum SecretManagerProviderId {
  HASHICORP = "hashicorp",
}

export const SecretManagerProviderMetaDataBaseSchema = Type.Object({
  id: Type.Enum(SecretManagerProviderId),
  name: Type.String(),
  logo: Type.String(),
  connected: Type.Boolean(),
})

export const SecretManagerProviderMetaDataSchema = DiscriminatedUnion('id', [
  Type.Object({
    ...SecretManagerProviderMetaDataBaseSchema.properties,
    id: Type.Literal(SecretManagerProviderId.HASHICORP),
    fields: Type.Record(Type.KeyOf(HashicorpProviderConfigSchema), SecretManagerFieldSchema)
  }),
])

export type SecretManagerProviderMetaData = Static<typeof SecretManagerProviderMetaDataSchema>
