import { ActivepiecesError, ApEdition, ErrorCode, isNil, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getPrincipalRoleOrThrow } from '../ee/authentication/project-role/rbac-middleware'
import { system } from '../helper/system/system'

const EDITION_REQUIRES_RBAC = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())

export async function resolvePermissionChecker({ userId, projectId, log }: {
    userId: string
    projectId: string
    log: FastifyBaseLogger
}): Promise<PermissionChecker> {
    if (!EDITION_REQUIRES_RBAC) {
        return ALLOW_ALL
    }

    try {
        const role = await getPrincipalRoleOrThrow(userId, projectId, log)
        const permissionSet = new Set(role.permissions ?? [])
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
    catch (err) {
        if (err instanceof ActivepiecesError && err.error.code === ErrorCode.AUTHORIZATION) {
            return buildChecker((permission, toolTitle) => {
                if (isNil(permission)) {
                    return null
                }
                return {
                    content: [{ type: 'text' as const, text: `❌ Permission denied: no role found for this user in the project. Cannot execute "${toolTitle}".` }],
                    isError: true,
                }
            })
        }
        throw err
    }
}

export const ALLOW_ALL: PermissionChecker = {
    check: () => null,
    wrapExecute: ({ execute }) => execute,
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

type McpToolErrorResult = {
    content: Array<{ type: 'text', text: string }>
    isError: boolean
}
