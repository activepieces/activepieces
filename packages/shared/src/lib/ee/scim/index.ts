import { z } from 'zod'
import { isNil } from '../../core/common'
import { PlatformRole } from '../../core/user'

export const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User'
export const SCIM_GROUP_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Group'
export const SCIM_LIST_RESPONSE_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'
export const SCIM_PATCH_OP_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp'
export const SCIM_ERROR_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:Error'
export const SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'
export const SCIM_RESOURCE_TYPE_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:ResourceType'
export const SCIM_SCHEMA_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Schema'

export const SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA = 'urn:ietf:params:scim:schemas:activepieces:1.0:CustomUserAttributes'

export const ScimName = z.object({
    givenName: z.string().optional(),
    familyName: z.string().optional(),
    formatted: z.string().optional(),
})

export const ScimEmail = z.object({
    value: z.string(),
    type: z.string().optional(),
    primary: z.boolean().optional(),
})

export const ScimMeta = z.object({
    resourceType: z.string(),
    created: z.string().optional(),
    lastModified: z.string().optional(),
    location: z.string().optional(),
})

const ScimCustomAttributesSchema = {
    [SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]: z.object({
        platformRole: z.nativeEnum(PlatformRole),
    }).optional(),
}

export const ScimUserResource = z.object({
    schemas: z.array(z.string()),
    id: z.string(),
    externalId: z.string().optional(),
    userName: z.string(),
    name: ScimName.optional(),
    emails: z.array(ScimEmail).optional(),
    active: z.boolean(),
    meta: ScimMeta,
})

export type ScimUserResource = z.infer<typeof ScimUserResource>

export const CreateScimUserRequest = z.object({
    schemas: z.array(z.string()),
    externalId: z.string().optional(),
    userName: z.string(),
    name: ScimName.optional(),
    emails: z.array(ScimEmail).optional(),
    active: z.boolean().optional(),
    ...ScimCustomAttributesSchema,
})

export type CreateScimUserRequest = z.infer<typeof CreateScimUserRequest>

export const ReplaceScimUserRequest = z.object({
    schemas: z.array(z.string()),
    externalId: z.string().optional(),
    userName: z.string(),
    name: ScimName.optional(),
    emails: z.array(ScimEmail).optional(),
    active: z.boolean().optional(),
    ...ScimCustomAttributesSchema,
})

export type ReplaceScimUserRequest = z.infer<typeof ReplaceScimUserRequest>

export const ScimGroupMember = z.object({
    value: z.string(),
    display: z.string().optional(),
    $ref: z.string().optional(),
})

export type ScimGroupMember = z.infer<typeof ScimGroupMember>

export const ScimGroupResource = z.object({
    schemas: z.array(z.string()),
    id: z.string(),
    externalId: z.string().optional(),
    displayName: z.string(),
    members: z.array(ScimGroupMember),
    meta: ScimMeta,
})

export type ScimGroupResource = z.infer<typeof ScimGroupResource>

export const CreateScimGroupRequest = z.object({
    schemas: z.array(z.string()),
    externalId: z.string().optional(),
    displayName: z.string(),
    members: z.array(ScimGroupMember).optional(),
})

export type CreateScimGroupRequest = z.infer<typeof CreateScimGroupRequest>

export const ReplaceScimGroupRequest = z.object({
    schemas: z.array(z.string()),
    externalId: z.string().optional(),
    displayName: z.string(),
    members: z.array(ScimGroupMember).optional(),
})

export type ReplaceScimGroupRequest = z.infer<typeof ReplaceScimGroupRequest>

export const ScimPatchOperation = z.object({
    op: z.union([
        z.literal('add'),
        z.literal('remove'),
        z.literal('replace'),
        z.literal('Add'),
        z.literal('Remove'),
        z.literal('Replace'),
    ]),
    path: z.string().optional(),
    value: z.unknown().optional(),
})

export type ScimPatchOperation = z.infer<typeof ScimPatchOperation>

export const ScimPatchRequest = z.object({
    schemas: z.array(z.string()),
    Operations: z.array(ScimPatchOperation),
})

export type ScimPatchRequest = z.infer<typeof ScimPatchRequest>

export const ScimListResponse = z.object({
    schemas: z.array(z.string()),
    totalResults: z.number(),
    startIndex: z.number(),
    itemsPerPage: z.number(),
    Resources: z.array(z.unknown()),
})

export type ScimListResponse = z.infer<typeof ScimListResponse>

export const ScimErrorResponse = z.object({
    schemas: z.array(z.string()),
    status: z.string(),
    detail: z.string().optional(),
    scimType: z.string().optional(),
})

export type ScimErrorResponse = z.infer<typeof ScimErrorResponse>

export const ScimListQueryParams = z.object({
    filter: z.string().optional(),
    startIndex: z.coerce.number().default(1).optional(),
    count: z.coerce.number().default(100).optional(),
})

export type ScimListQueryParams = z.infer<typeof ScimListQueryParams>

export const ScimResourceId = z.object({
    id: z.string(),
})

export type ScimResourceId = z.infer<typeof ScimResourceId>

export class ScimError extends Error {
    constructor(public status: number, public detail: string) {
        super(detail)
    }

    override toString(): string {
        return JSON.stringify({
            schemas: [SCIM_ERROR_SCHEMA],
            status: String(this.status),
            detail: this.detail,
        })
    }
}

export const parseScimFilter = (filter: string | undefined, field: string) => {
    if (isNil(filter)) {
        return undefined
    }
    const regex = new RegExp(`${field}\\s+eq\\s+"([^"]+)"`, 'i')
    const match = filter.match(regex)
    if (match) {
        return match[1].toLowerCase().trim()
    }
    return undefined
}
