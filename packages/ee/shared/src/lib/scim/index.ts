import { isNil, PlatformRole } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User'
export const SCIM_GROUP_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Group'
export const SCIM_LIST_RESPONSE_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'
export const SCIM_PATCH_OP_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp'
export const SCIM_ERROR_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:Error'
export const SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'
export const SCIM_RESOURCE_TYPE_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:ResourceType'
export const SCIM_SCHEMA_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Schema'

export const SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA = 'urn:ietf:params:scim:schemas:activepieces:1.0:CustomUserAttributes'

export const ScimName = Type.Object({
    givenName: Type.Optional(Type.String()),
    familyName: Type.Optional(Type.String()),
    formatted: Type.Optional(Type.String()),
})

export const ScimEmail = Type.Object({
    value: Type.String(),
    type: Type.Optional(Type.String()),
    primary: Type.Optional(Type.Boolean()),
})

export const ScimMeta = Type.Object({
    resourceType: Type.String(),
    created: Type.Optional(Type.String()),
    lastModified: Type.Optional(Type.String()),
    location: Type.Optional(Type.String()),
})

export const ScimCustomAttributesSchema = {
    [SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]: Type.Optional(Type.Object({
        platformRole: Type.Enum(PlatformRole),
    })),
}

export const ScimUserResource = Type.Object({
    schemas: Type.Array(Type.String()),
    id: Type.String(),
    externalId: Type.Optional(Type.String()),
    userName: Type.String(),
    name: Type.Optional(ScimName),
    emails: Type.Optional(Type.Array(ScimEmail)),
    active: Type.Boolean(),
    meta: ScimMeta,
})

export type ScimUserResource = Static<typeof ScimUserResource>

export const CreateScimUserRequest = Type.Object({
    schemas: Type.Array(Type.String()),
    externalId: Type.Optional(Type.String()),
    userName: Type.String(),
    name: Type.Optional(ScimName),
    emails: Type.Optional(Type.Array(ScimEmail)),
    active: Type.Optional(Type.Boolean()),
    ...ScimCustomAttributesSchema,
})

export type CreateScimUserRequest = Static<typeof CreateScimUserRequest>

export const ReplaceScimUserRequest = Type.Object({
    schemas: Type.Array(Type.String()),
    externalId: Type.Optional(Type.String()),
    userName: Type.String(),
    name: Type.Optional(ScimName),
    emails: Type.Optional(Type.Array(ScimEmail)),
    active: Type.Optional(Type.Boolean()),
    ...ScimCustomAttributesSchema,
})

export type ReplaceScimUserRequest = Static<typeof ReplaceScimUserRequest>

export const ScimGroupMember = Type.Object({
    value: Type.String(),
    display: Type.Optional(Type.String()),
    $ref: Type.Optional(Type.String()),
})

export type ScimGroupMember = Static<typeof ScimGroupMember>

export const ScimGroupResource = Type.Object({
    schemas: Type.Array(Type.String()),
    id: Type.String(),
    externalId: Type.Optional(Type.String()),
    displayName: Type.String(),
    members: Type.Array(ScimGroupMember),
    meta: ScimMeta,
})

export type ScimGroupResource = Static<typeof ScimGroupResource>

export const CreateScimGroupRequest = Type.Object({
    schemas: Type.Array(Type.String()),
    externalId: Type.Optional(Type.String()),
    displayName: Type.String(),
    members: Type.Optional(Type.Array(ScimGroupMember)),
})

export type CreateScimGroupRequest = Static<typeof CreateScimGroupRequest>

export const ReplaceScimGroupRequest = Type.Object({
    schemas: Type.Array(Type.String()),
    externalId: Type.Optional(Type.String()),
    displayName: Type.String(),
    members: Type.Optional(Type.Array(ScimGroupMember)),
})

export type ReplaceScimGroupRequest = Static<typeof ReplaceScimGroupRequest>

export const ScimPatchOperation = Type.Object({
    op: Type.Union([
        Type.Literal('add'),
        Type.Literal('remove'),
        Type.Literal('replace'),
        Type.Literal('Add'),
        Type.Literal('Remove'),
        Type.Literal('Replace'),
    ]),
    path: Type.Optional(Type.String()),
    value: Type.Optional(Type.Unknown()),
})

export type ScimPatchOperation = Static<typeof ScimPatchOperation>

export const ScimPatchRequest = Type.Object({
    schemas: Type.Array(Type.String()),
    Operations: Type.Array(ScimPatchOperation),
})

export type ScimPatchRequest = Static<typeof ScimPatchRequest>

export const ScimListResponse = Type.Object({
    schemas: Type.Array(Type.String()),
    totalResults: Type.Number(),
    startIndex: Type.Number(),
    itemsPerPage: Type.Number(),
    Resources: Type.Array(Type.Unknown()),
})

export type ScimListResponse = Static<typeof ScimListResponse>

export const ScimErrorResponse = Type.Object({
    schemas: Type.Array(Type.String()),
    status: Type.String(),
    detail: Type.Optional(Type.String()),
    scimType: Type.Optional(Type.String()),
})

export type ScimErrorResponse = Static<typeof ScimErrorResponse>

export const ScimListQueryParams = Type.Object({
    filter: Type.Optional(Type.String()),
    startIndex: Type.Optional(Type.Number({ default: 1 })),
    count: Type.Optional(Type.Number({ default: 100 })),
})

export type ScimListQueryParams = Static<typeof ScimListQueryParams>

export const ScimResourceId = Type.Object({
    id: Type.String(),
})

export type ScimResourceId = Static<typeof ScimResourceId>

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