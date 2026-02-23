import {
    SCIM_GROUP_SCHEMA,
    SCIM_RESOURCE_TYPE_SCHEMA,
    SCIM_SCHEMA_SCHEMA,
    SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA,
    SCIM_USER_SCHEMA,
} from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'

export const scimDiscoveryController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/ServiceProviderConfig', ServiceProviderConfigRequest, async (_request, reply) => {
        return reply.status(StatusCodes.OK).send({
            schemas: [SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA],
            documentationUri: 'https://www.activepieces.com/docs',
            patch: {
                supported: true,
            },
            bulk: {
                supported: false,
                maxOperations: 0,
                maxPayloadSize: 0,
            },
            filter: {
                supported: true,
                maxResults: 100,
            },
            changePassword: {
                supported: false,
            },
            sort: {
                supported: false,
            },
            etag: {
                supported: false,
            },
            authenticationSchemes: [
                {
                    type: 'oauthbearertoken',
                    name: 'OAuth Bearer Token',
                    description: 'Authentication scheme using the API key as a Bearer token',
                    specUri: 'https://www.rfc-editor.org/info/rfc6750',
                    documentationUri: 'https://www.activepieces.com/docs',
                },
            ],
            meta: {
                resourceType: 'ServiceProviderConfig',
                location: '/scim/v2/ServiceProviderConfig',
            },
        })
    })

    app.get('/ResourceTypes', ResourceTypesRequest, async (_request, reply) => {
        return reply.status(StatusCodes.OK).send([
            {
                schemas: [SCIM_RESOURCE_TYPE_SCHEMA],
                id: 'User',
                name: 'User',
                endpoint: '/Users',
                description: 'User Account',
                schema: SCIM_USER_SCHEMA,
                meta: {
                    resourceType: 'ResourceType',
                    location: '/scim/v2/ResourceTypes/User',
                },
            },
            {
                schemas: [SCIM_RESOURCE_TYPE_SCHEMA],
                id: 'Group',
                name: 'Group',
                endpoint: '/Groups',
                description: 'Group (mapped to Activepieces Projects)',
                schema: SCIM_GROUP_SCHEMA,
                meta: {
                    resourceType: 'ResourceType',
                    location: '/scim/v2/ResourceTypes/Group',
                },
            },
        ])
    })

    app.get('/Schemas', SchemasRequest, async (_request, reply) => {
        return reply.status(StatusCodes.OK).send([
            {
                schemas: [SCIM_SCHEMA_SCHEMA],
                id: SCIM_USER_SCHEMA,
                name: 'User',
                description: 'User Account',
                attributes: [
                    {
                        name: 'userName',
                        type: 'string',
                        multiValued: false,
                        required: true,
                        caseExact: false,
                        mutability: 'readWrite',
                        returned: 'default',
                        uniqueness: 'server',
                    },
                    {
                        name: 'name',
                        type: 'complex',
                        multiValued: false,
                        required: false,
                        mutability: 'readWrite',
                        returned: 'default',
                        subAttributes: [
                            {
                                name: 'givenName',
                                type: 'string',
                                multiValued: false,
                                required: false,
                                mutability: 'readWrite',
                                returned: 'default',
                            },
                            {
                                name: 'familyName',
                                type: 'string',
                                multiValued: false,
                                required: false,
                                mutability: 'readWrite',
                                returned: 'default',
                            },
                        ],
                    },
                    {
                        name: 'emails',
                        type: 'complex',
                        multiValued: true,
                        required: false,
                        mutability: 'readWrite',
                        returned: 'default',
                        subAttributes: [
                            {
                                name: 'value',
                                type: 'string',
                                multiValued: false,
                                required: true,
                                mutability: 'readWrite',
                                returned: 'default',
                            },
                            {
                                name: 'primary',
                                type: 'boolean',
                                multiValued: false,
                                required: false,
                                mutability: 'readWrite',
                                returned: 'default',
                            },
                        ],
                    },
                    {
                        name: 'active',
                        type: 'boolean',
                        multiValued: false,
                        required: false,
                        mutability: 'readWrite',
                        returned: 'default',
                    },
                    {
                        name: 'externalId',
                        type: 'string',
                        multiValued: false,
                        required: false,
                        mutability: 'readWrite',
                        returned: 'default',
                    },
                ],
                meta: {
                    resourceType: 'Schema',
                    location: `/scim/v2/Schemas/${SCIM_USER_SCHEMA}`,
                },
            },
            {
                schemas: [SCIM_SCHEMA_SCHEMA],
                id: SCIM_GROUP_SCHEMA,
                name: 'Group',
                description: 'Group (mapped to Activepieces Projects)',
                attributes: [
                    {
                        name: 'displayName',
                        type: 'string',
                        multiValued: false,
                        required: true,
                        mutability: 'readWrite',
                        returned: 'default',
                    },
                    {
                        name: 'members',
                        type: 'complex',
                        multiValued: true,
                        required: false,
                        mutability: 'readWrite',
                        returned: 'default',
                        subAttributes: [
                            {
                                name: 'value',
                                type: 'string',
                                multiValued: false,
                                required: true,
                                mutability: 'immutable',
                                returned: 'default',
                            },
                            {
                                name: 'display',
                                type: 'string',
                                multiValued: false,
                                required: false,
                                mutability: 'readOnly',
                                returned: 'default',
                            },
                        ],
                    },
                    {
                        name: 'externalId',
                        type: 'string',
                        multiValued: false,
                        required: false,
                        mutability: 'readWrite',
                        returned: 'default',
                    },
                ],
                meta: {
                    resourceType: 'Schema',
                    location: `/scim/v2/Schemas/${SCIM_GROUP_SCHEMA}`,
                },
            },
        ])
    })
}

const scimSecurity = securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE])

const ServiceProviderConfigRequest = {
    config: {
        security: scimSecurity,
    },
}

const ResourceTypesRequest = {
    config: {
        security: scimSecurity,
    },
}

const SchemasRequest = {
    config: {
        security: scimSecurity,
    },
}
