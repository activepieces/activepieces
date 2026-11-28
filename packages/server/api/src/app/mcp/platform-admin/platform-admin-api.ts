import { assertNotNullOrUndefined, isNil } from '@activepieces/core-utils'
import { PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance, FastifyRequest, HTTPMethods, RouteOptions } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { AuthorizationType, RouteKind } from '../../core/security/authorization/common'
import { userService } from '../../user/user-service'

let server: FastifyInstance | null = null
let exposedRoutesCache: ExposedRoute[] | null = null
let registeredRoutes: RouteOptions[] = []

function collectRoutes(app: FastifyInstance): void {
    server = app
    registeredRoutes = []
    exposedRoutesCache = null
    app.addHook('onRoute', (route) => {
        registeredRoutes.push(route)
    })
}

function guardMcpCalls(app: FastifyInstance): void {
    app.addHook('preHandler', async (request, reply) => {
        const isBlockedMcpCall = isMcpCall(request) && !isExposed(request.routeOptions.config.mcp)
        if (isBlockedMcpCall) {
            return reply.code(StatusCodes.FORBIDDEN).send({ message: 'This endpoint is not available to MCP tools. Do not retry it: tell the user to do this in Platform Admin themselves.' })
        }
    })
    app.addHook('onSend', async (request, reply) => {
        const isRoutedMcpCall = isMcpCall(request) && !isNil(request.routeOptions.url)
        if (isRoutedMcpCall) {
            void reply.header(MCP_ROUTE_HEADER, request.routeOptions.url)
        }
    })
}

function page(doc: string): (route: RouteOptions) => void {
    return (route) => {
        if (!isNil(route.config) && isCallableByUser(route)) {
            route.config.mcp = { doc, ...route.config.mcp }
        }
    }
}

function routes(): PlatformAdminRoute[] {
    return registeredRoutes
        .filter((route) => isCallableByUser(route) && (!isNil(route.config?.mcp) || isAdminOnly(route)))
        .flatMap((route) => (Array.isArray(route.method) ? route.method : [route.method])
            .filter((method) => method !== 'HEAD')
            .map((method) => ({ method, url: route.url, mcp: route.config?.mcp, schema: route.schema })))
}

function exposedRoutes(): ExposedRoute[] {
    exposedRoutesCache ??= routes().flatMap(({ method, url, mcp, schema }) => isExposed(mcp) ? [{ method, url, doc: mcp.doc, redact: mcp.redact ?? [], schema: describeSchema(schema) }] : [])
    return exposedRoutesCache
}

function isExposed(mcp: McpRouteConfig | undefined): mcp is McpRouteConfig & { doc: string } {
    return !isNil(mcp?.doc) && mcp.deny !== true
}

function isMcpCall(request: FastifyRequest): boolean {
    return !isNil(request.headers[MCP_ORIGIN_HEADER])
}

function isCallableByUser(route: RouteOptions): boolean {
    const security = route.config?.security
    return security?.kind === RouteKind.AUTHENTICATED && 'allowedPrincipals' in security.authorization && security.authorization.allowedPrincipals.includes(PrincipalType.USER)
}

function isAdminOnly(route: RouteOptions): boolean {
    const security = route.config?.security
    return security?.kind === RouteKind.AUTHENTICATED && security.authorization.type === AuthorizationType.PLATFORM && security.authorization.adminOnly
}

function describeSchema(schema: RouteOptions['schema']): Record<string, unknown> {
    const parts = { params: schema?.params, query: schema?.querystring, body: schema?.body }
    return Object.fromEntries(Object.entries(parts).flatMap(([key, schema]) => schema instanceof z.ZodType
        ? [[key, z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })]]
        : []))
}

async function call({ userId, method, path, query, body, log }: PlatformAdminCallParams): Promise<CallResult> {
    if (isNil(server)) {
        throw new Error('platformAdminApi.collectRoutes was not called')
    }
    const user = await userService(log).getOneOrFail({ id: userId })
    assertNotNullOrUndefined(user.platformId, 'platformId')
    const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
    const token = await accessTokenManager(log).generateToken({
        id: user.id,
        type: PrincipalType.USER,
        platform: { id: user.platformId },
        tokenVersion: identity.tokenVersion,
    }, TOKEN_TTL_SECONDS)
    const response = await server.inject({
        method,
        url: path,
        query,
        payload: body,
        headers: { authorization: `Bearer ${token}`, [MCP_ORIGIN_HEADER]: 'true' },
    })
    const routeHeader = response.headers[MCP_ROUTE_HEADER]
    return {
        statusCode: response.statusCode,
        body: response.body,
        route: typeof routeHeader === 'string' ? routeHeader : null,
    }
}

export const platformAdminApi = {
    collectRoutes,
    guardMcpCalls,
    page,
    routes,
    exposedRoutes,
    call,
}

const MCP_ORIGIN_HEADER = 'x-ap-mcp-origin'
const MCP_ROUTE_HEADER = 'x-ap-mcp-route'
const TOKEN_TTL_SECONDS = 60

export type McpRouteConfig = {
    doc?: string
    deny?: boolean
    redact?: string[]
}

type PlatformAdminRoute = {
    method: HTTPMethods
    url: string
    mcp: McpRouteConfig | undefined
    schema: RouteOptions['schema']
}

type ExposedRoute = {
    method: HTTPMethods
    url: string
    doc: string
    redact: string[]
    schema: Record<string, unknown>
}

export type PlatformAdminCallParams = {
    userId: string
    method: 'GET' | 'POST' | 'DELETE'
    path: string
    query?: Record<string, string>
    body?: Record<string, unknown>
    log: FastifyBaseLogger
}

type CallResult = {
    statusCode: number
    body: string
    route: string | null
}
