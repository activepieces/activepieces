import { ActivepiecesError, ErrorCode, isNil, Permission, tryCatch } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { editionRequiresRbac, getPrincipalRoleOrThrow } from '../ee/authentication/project-role/rbac-middleware'

export async function resolvePermissionChecker({ userId, projectId, log }: ResolveCheckerParams): Promise<PermissionChecker> {
    return buildPermissionChecker({ userId, projectId, log })
}

export async function resolveMcpPermissionChecker({ userId, projectId, log }: ResolveCheckerParams): Promise<PermissionChecker> {
    return buildPermissionChecker({ userId, projectId, log, requiredPermission: Permission.READ_MCP })
}

export const ALLOW_ALL: PermissionChecker = {
    check: () => null,
    wrapExecute: ({ execute }) => execute,
}

async function buildPermissionChecker({ userId, projectId, log, requiredPermission }: ResolveCheckerParams & {
    requiredPermission?: Permission
}): Promise<PermissionChecker> {
    if (!editionRequiresRbac()) {
        return ALLOW_ALL
    }

    const role = await resolveProjectRole({ userId, projectId, log })

    if (isNil(role)) {
        return buildDenyAllChecker((toolTitle) => `❌ Permission denied: no role found for this user in the project. Cannot execute "${toolTitle}".`)
    }

    const permissionSet = new Set(role.permissions ?? [])

    if (!isNil(requiredPermission) && !permissionSet.has(requiredPermission)) {
        return buildDenyAllChecker((toolTitle) => `❌ Permission denied: your role does not have the "${requiredPermission}" permission required to use MCP in this project. Cannot execute "${toolTitle}".`)
    }

    return buildChecker((permission, toolTitle) => {
        if (isNil(permission) || permissionSet.has(permission)) {
            return null
        }
        return {
            content: [{ type: 'text' as const, text: `❌ Permission denied: your role does not have the "${permission}" permission required to use "${toolTitle}".` }],
            isError: true,
        }
    })
}

async function resolveProjectRole({ userId, projectId, log }: ResolveCheckerParams): Promise<ProjectRole | null> {
    const { data, error } = await tryCatch(() => getPrincipalRoleOrThrow(userId, projectId, log))
    if (isNil(error)) {
        return data
    }
    if (error instanceof ActivepiecesError && error.error.code === ErrorCode.AUTHORIZATION) {
        return null
    }
    throw error
}

function buildDenyAllChecker(buildMessage: (toolTitle: string) => string): PermissionChecker {
    return buildChecker((_permission, toolTitle) => ({
        content: [{ type: 'text' as const, text: buildMessage(toolTitle) }],
        isError: true,
    }))
}

function buildChecker(check: PermissionChecker['check']): PermissionChecker {
    return {
        check,
        wrapExecute: ({ execute, permission, toolTitle }) => {
            const error = check(permission, toolTitle)
            return isNil(error) ? execute : async () => error
        },
    }
}

export type PermissionChecker = {
    check: (permission: Permission | undefined, toolTitle: string) => McpToolErrorResult | null
    wrapExecute: (params: { execute: McpToolDefinition['execute'], permission: Permission | undefined, toolTitle: string }) => McpToolDefinition['execute']
}

type ResolveCheckerParams = {
    userId: string
    projectId: string
    log: FastifyBaseLogger
}

type McpToolErrorResult = {
    content: Array<{ type: 'text', text: string }>
    isError: boolean
}
