import { z } from 'zod'
import { formErrors } from '../../form-errors'

export enum SecretManagerProviderId {
    HASHICORP = 'hashicorp',
    AWS = 'aws',
    CYBERARK = 'cyberark-conjur',
    ONEPASSWORD = 'onepassword',
}

export enum SecretManagerConnectionScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}



export const HashicorpProviderConfigSchema = z.object({
    url: z.string().min(1, formErrors.required),
    namespace: z.string().optional(),
    roleId: z.string().min(1, formErrors.required),
    secretId: z.string().min(1, formErrors.required),
})
export type HashicorpProviderConfig = z.infer<typeof HashicorpProviderConfigSchema>



export const AWSProviderConfigSchema = z.object({
    accessKeyId: z.string().min(1, formErrors.required),
    secretAccessKey: z.string().min(1, formErrors.required),
    region: z.string().min(1, formErrors.required),
})
export type AWSProviderConfig = z.infer<typeof AWSProviderConfigSchema>




export const CyberarkConjurProviderConfigSchema = z.object({
    organizationAccountName: z.string().min(1, formErrors.required),
    loginId: z.string().min(1, formErrors.required),
    url: z.string().min(1, formErrors.required),
    apiKey: z.string().min(1, formErrors.required),
})
export type CyberarkConjurProviderConfig = z.infer<typeof CyberarkConjurProviderConfigSchema>


export const OnePasswordProviderConfigSchema = z.object({
    serviceAccountToken: z.string().min(1, formErrors.required),
})
export type OnePasswordProviderConfig = z.infer<typeof OnePasswordProviderConfigSchema>

const SecretManagerConnectionScopeFields = {
    name: z.string().min(1, formErrors.required),
    scope: z.enum(SecretManagerConnectionScope),
    projectIds: z.array(z.string()).optional(),
}

export const ConnectSecretManagerRequestSchema = z
    .discriminatedUnion('providerId', [
        z.object({
            ...SecretManagerConnectionScopeFields,
            providerId: z.literal(SecretManagerProviderId.HASHICORP),
            config: HashicorpProviderConfigSchema,
        }),
        z.object({
            ...SecretManagerConnectionScopeFields,
            providerId: z.literal(SecretManagerProviderId.AWS),
            config: AWSProviderConfigSchema,
        }),
        z.object({
            ...SecretManagerConnectionScopeFields,
            providerId: z.literal(SecretManagerProviderId.CYBERARK),
            config: CyberarkConjurProviderConfigSchema,
        }),
        z.object({
            ...SecretManagerConnectionScopeFields,
            providerId: z.literal(SecretManagerProviderId.ONEPASSWORD),
            config: OnePasswordProviderConfigSchema,
        }),
    ])
    .superRefine((data, ctx) => {
        if (data.scope === SecretManagerConnectionScope.PROJECT) {
            if (!data.projectIds || data.projectIds.length < 1) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Please select at least one project',
                    path: ['projectIds'],
                })
            }
        }
    })

export type ConnectSecretManagerRequest = z.infer<typeof ConnectSecretManagerRequestSchema>

export const DisconnectSecretManagerRequestSchema = z.object({
    providerId: z.enum(SecretManagerProviderId),
})
export type DisconnectSecretManagerRequest = z.infer<typeof DisconnectSecretManagerRequestSchema>


export type SecretManagerProviderConfig =
  | HashicorpProviderConfig
  | AWSProviderConfig
  | CyberarkConjurProviderConfig
  | OnePasswordProviderConfig
