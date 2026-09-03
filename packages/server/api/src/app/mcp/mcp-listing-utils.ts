import { isNil, unique } from '@activepieces/core-utils'
import { PLATFORM_WIDE_PROJECT_FILTER_VALUE, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { Brackets, In, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { projectRepo } from '../project/project-repo'
import { mapToUserWithMetaInformation, userRepo, userService } from '../user/user-service'

function applyProjectFilter<T extends ObjectLiteral>({ queryBuilder, alias, projectIds }: ApplyProjectFilterParams<T>): void {
    if (isNil(projectIds)) {
        return
    }
    const scopedProjectIds = projectIds.filter((projectId) => projectId !== PLATFORM_WIDE_PROJECT_FILTER_VALUE)
    const includesPlatformWide = projectIds.length !== scopedProjectIds.length
    queryBuilder.andWhere(new Brackets((qb) => {
        if (scopedProjectIds.length > 0) {
            qb.orWhere(`${alias}."projectId" IN (:...scopedProjectIds)`, { scopedProjectIds })
        }
        if (includesPlatformWide) {
            qb.orWhere(`${alias}."projectId" IS NULL`)
        }
    }))
}

async function findProjectNames({ projectIds, platformId }: FindProjectNamesParams): Promise<Map<string, string>> {
    const distinct = unique(projectIds.filter((projectId): projectId is string => !isNil(projectId)))
    if (distinct.length === 0) {
        return new Map()
    }
    const projects = await projectRepo().findBy({ id: In(distinct), platformId })
    return new Map(projects.map((project) => [project.id, project.displayName]))
}

async function findMembers({ userIds, platformId }: FindMembersParams): Promise<Map<string, UserWithMetaInformation>> {
    const distinct = unique(userIds)
    if (distinct.length === 0) {
        return new Map()
    }
    const users = await userRepo().find({ where: { id: In(distinct), platformId }, relations: { identity: true } })
    return new Map(users.flatMap((user) => {
        const member = mapToUserWithMetaInformation(user)
        return isNil(member) ? [] : [[user.id, member] as const]
    }))
}

async function resolveUserIdFilter(req: FastifyRequest): Promise<string | null> {
    const user = await userService(req.log).getOneOrFail({ id: req.principal.id })
    return userService(req.log).isUserPrivileged(user) ? null : req.principal.id
}

export const mcpListingUtils = { applyProjectFilter, findProjectNames, findMembers, resolveUserIdFilter }

type ApplyProjectFilterParams<T extends ObjectLiteral> = {
    queryBuilder: SelectQueryBuilder<T>
    alias: string
    projectIds: string[] | undefined
}

type FindProjectNamesParams = {
    projectIds: (string | null)[]
    platformId: string
}

type FindMembersParams = {
    userIds: string[]
    platformId: string
}
