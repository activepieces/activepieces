import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'

export enum CustomDomainStatus {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
}

export const CustomDomain = z.object({
    ...BaseModelSchema,
    domain: z.string(),
    platformId: z.string(),
    status: z.nativeEnum(CustomDomainStatus),
})

export type CustomDomain = z.infer<typeof CustomDomain>


export const AddDomainRequest = z.object({
    domain: z.string().regex(/^(?!.*\.example\.com$)(?!.*\.example\.net$).*/),
})

export type AddDomainRequest = z.infer<typeof AddDomainRequest>

export const ListCustomDomainsRequest = z.object({
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
})

export type ListCustomDomainsRequest = z.infer<typeof ListCustomDomainsRequest>
