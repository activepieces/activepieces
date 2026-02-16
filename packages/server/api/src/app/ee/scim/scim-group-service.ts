import {
    ActivepiecesError,
    DefaultProjectRole,
    ErrorCode,
    isNil,
    ProjectType,
    UserStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { platformService } from '../../platform/platform.service'
import { projectRepo, projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { ProjectMemberEntity } from '../projects/project-members/project-member.entity'
import { projectMemberService } from '../projects/project-members/project-member.service'
import {
    CreateScimGroupRequest,
    ReplaceScimGroupRequest,
    SCIM_GROUP_SCHEMA,
    SCIM_LIST_RESPONSE_SCHEMA,
    ScimGroupMember,
    ScimGroupResource,
    ScimListResponse,
    ScimPatchRequest,
} from '@activepieces/ee-shared'

const projectMemberRepo = repoFactory(ProjectMemberEntity)

export const scimGroupService = (log: FastifyBaseLogger) => ({
    async create(params: {
        platformId: string
        request: CreateScimGroupRequest
    }): Promise<ScimGroupResource> {
        const { platformId, request } = params

        const platform = await platformService.getOneOrThrow(platformId)

        const project = await projectService.create({
            displayName: request.displayName,
            ownerId: platform.ownerId,
            platformId,
            externalId: request.externalId,
            type: ProjectType.TEAM,
        })

        // Add members
        const members: ScimGroupMember[] = []
        if (!isNil(request.members) && request.members.length > 0) {
            for (const member of request.members) {
                await addMemberToProject({
                    userId: member.value,
                    projectId: project.id,
                    platformId,
                    log,
                })
                const user = await userService.get({ id: member.value })
                if (!isNil(user)) {
                    const identity = await userService.getMetaInformation({ id: user.id })
                    members.push({
                        value: user.id,
                        display: identity.email,
                        $ref: `/scim/v2/Users/${user.id}`,
                    })
                }
            }
        }

        return toScimGroupResource(project.id, project.displayName, project.externalId ?? undefined, members, project.created, project.updated)
    },

    async getById(params: {
        platformId: string
        projectId: string
    }): Promise<ScimGroupResource> {
        const { platformId, projectId } = params
        const project = await projectService.getOne(projectId)

        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    entityId: projectId,
                },
            })
        }

        const members = await getProjectMembers(projectId, platformId)
        return toScimGroupResource(project.id, project.displayName, project.externalId ?? undefined, members, project.created, project.updated)
    },

    async list(params: {
        platformId: string
        filter?: string
        startIndex?: number
        count?: number
    }): Promise<ScimListResponse> {
        const { platformId, filter, startIndex = 1, count = 100 } = params

        // Parse SCIM filter - support "displayName eq \"value\""
        let filterDisplayName: string | undefined
        if (!isNil(filter)) {
            const match = filter.match(/displayName\s+eq\s+"([^"]+)"/i)
            if (match) {
                filterDisplayName = match[1]
            }
        }

        if (!isNil(filterDisplayName)) {
            const project = await projectService.getByPlatformIdAndExternalId({
                platformId,
                externalId: filterDisplayName,
            })

            if (isNil(project) || project.type !== ProjectType.TEAM) {
                return {
                    schemas: [SCIM_LIST_RESPONSE_SCHEMA],
                    totalResults: 0,
                    startIndex,
                    itemsPerPage: count,
                    Resources: [],
                }
            }

            const members = await getProjectMembers(project.id, platformId)
            const resource = toScimGroupResource(project.id, project.displayName, project.externalId ?? undefined, members, project.created, project.updated)
            return {
                schemas: [SCIM_LIST_RESPONSE_SCHEMA],
                totalResults: 1,
                startIndex,
                itemsPerPage: count,
                Resources: [resource],
            }
        }

        // List all team projects for this platform
        const projects = await projectService.getAllForUser({
            platformId,
            userId: '', // We pass isPrivileged=true so userId is not used
            isPrivileged: true,
        })

        const teamProjects = projects.filter(p => p.type === ProjectType.TEAM)

        // Apply pagination
        const paginatedProjects = teamProjects.slice(startIndex - 1, startIndex - 1 + count)

        const scimGroups: ScimGroupResource[] = await Promise.all(
            paginatedProjects.map(async (project) => {
                const members = await getProjectMembers(project.id, platformId)
                return toScimGroupResource(project.id, project.displayName, project.externalId ?? undefined, members, project.created, project.updated)
            }),
        )

        return {
            schemas: [SCIM_LIST_RESPONSE_SCHEMA],
            totalResults: teamProjects.length,
            startIndex,
            itemsPerPage: count,
            Resources: scimGroups,
        }
    },

    async replace(params: {
        platformId: string
        projectId: string
        request: ReplaceScimGroupRequest
    }): Promise<ScimGroupResource> {
        const { platformId, projectId, request } = params
        const project = await projectService.getOne(projectId)

        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    entityId: projectId,
                },
            })
        }

        // Update project name
        await projectService.update(projectId, {
            type: ProjectType.TEAM,
            displayName: request.displayName,
            externalId: request.externalId,
        })

        // Sync members - remove all existing, add new
        const existingMembers = await projectMemberRepo().find({
            where: { projectId, platformId },
        })

        for (const existing of existingMembers) {
            await projectMemberService(log).delete(projectId, existing.id)
        }

        const members: ScimGroupMember[] = []
        if (!isNil(request.members) && request.members.length > 0) {
            for (const member of request.members) {
                await addMemberToProject({
                    userId: member.value,
                    projectId,
                    platformId,
                    log,
                })
                const user = await userService.get({ id: member.value })
                if (!isNil(user)) {
                    const identity = await userService.getMetaInformation({ id: user.id })
                    members.push({
                        value: user.id,
                        display: identity.email,
                        $ref: `/scim/v2/Users/${user.id}`,
                    })
                }
            }
        }

        const updatedProject = await projectService.getOneOrThrow(projectId)
        return toScimGroupResource(updatedProject.id, updatedProject.displayName, updatedProject.externalId ?? undefined, members, updatedProject.created, updatedProject.updated)
    },

    async patch(params: {
        platformId: string
        projectId: string
        request: ScimPatchRequest
    }): Promise<ScimGroupResource> {
        const { platformId, projectId, request } = params
        const project = await projectService.getOne(projectId)

        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    entityId: projectId,
                },
            })
        }

        for (const operation of request.Operations) {
            const op = operation.op.toLowerCase()

            if (op === 'add' && operation.path === 'members') {
                const memberValues = operation.value as ScimGroupMember[]
                for (const member of memberValues) {
                    await addMemberToProject({
                        userId: member.value,
                        projectId,
                        platformId,
                        log,
                    })
                }
            }
            else if (op === 'remove' && !isNil(operation.path) && operation.path.startsWith('members')) {
                // Parse path like: members[value eq "userId"]
                const match = operation.path.match(/members\[value\s+eq\s+"([^"]+)"\]/i)
                if (match) {
                    const userId = match[1]
                    await removeMemberFromProject({
                        userId,
                        projectId,
                        platformId,
                    })
                }
            }
            else if (op === 'replace') {
                // Handle path-based replace (e.g., path: "displayName", value: "New Name")
                if (operation.path === 'displayName' && !isNil(operation.value)) {
                    await projectService.update(projectId, {
                        type: ProjectType.TEAM,
                        displayName: operation.value as string,
                    })
                }
                else if (isNil(operation.path) && !isNil(operation.value) && typeof operation.value === 'object') {
                    // Handle value-based replace (e.g., value: { displayName: "New Name", members: [...] })
                    const value = operation.value as Record<string, unknown>
                    if ('displayName' in value) {
                        await projectService.update(projectId, {
                            type: ProjectType.TEAM,
                            displayName: value.displayName as string,
                        })
                    }

                    // Handle replace on members (full replacement)
                    if ('members' in value) {
                        const newMembers = value.members as ScimGroupMember[]
                        const existingMembers = await projectMemberRepo().find({
                            where: { projectId, platformId },
                        })
                        for (const existing of existingMembers) {
                            await projectMemberService(log).delete(projectId, existing.id)
                        }
                        for (const member of newMembers) {
                            await addMemberToProject({
                                userId: member.value,
                                projectId,
                                platformId,
                                log,
                            })
                        }
                    }
                }
            }
        }

        const updatedProject = await projectService.getOneOrThrow(projectId)
        const members = await getProjectMembers(projectId, platformId)
        return toScimGroupResource(updatedProject.id, updatedProject.displayName, updatedProject.externalId ?? undefined, members, updatedProject.created, updatedProject.updated)
    },

    async softDelete(params: {
        platformId: string
        projectId: string
    }): Promise<void> {
        const { platformId, projectId } = params
        const project = await projectService.getOne(projectId)

        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    entityId: projectId,
                },
            })
        }

        // Soft delete via TypeORM (uses the deleted column)
        await projectRepo().softDelete({ id: projectId })
    },
})

async function addMemberToProject(params: {
    userId: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const { userId, projectId, platformId, log } = params

    const user = await userService.get({ id: userId })
    if (isNil(user) || user.platformId !== platformId || user.status !== UserStatus.ACTIVE) {
        return
    }

    await projectMemberService(log).upsert({
        userId,
        projectId,
        projectRoleName: DefaultProjectRole.EDITOR,
    })
}

async function removeMemberFromProject(params: {
    userId: string
    projectId: string
    platformId: string
}): Promise<void> {
    const { userId, projectId, platformId } = params

    const member = await projectMemberRepo().findOneBy({
        userId,
        projectId,
        platformId,
    })

    if (!isNil(member)) {
        await projectMemberRepo().delete({ id: member.id })
    }
}

async function getProjectMembers(projectId: string, platformId: string): Promise<ScimGroupMember[]> {
    const members = await projectMemberRepo().find({
        where: { projectId, platformId },
    })

    const scimMembers: ScimGroupMember[] = []
    for (const member of members) {
        const userMeta = await userService.getMetaInformation({ id: member.userId })
        scimMembers.push({
            value: member.userId,
            display: userMeta.email,
            $ref: `/scim/v2/Users/${member.userId}`,
        })
    }

    return scimMembers
}

function toScimGroupResource(
    id: string,
    displayName: string,
    externalId: string | undefined,
    members: ScimGroupMember[],
    created: string,
    updated: string,
): ScimGroupResource {
    return {
        schemas: [SCIM_GROUP_SCHEMA],
        id,
        externalId,
        displayName,
        members,
        meta: {
            resourceType: 'Group',
            created,
            lastModified: updated,
            location: `/scim/v2/Groups/${id}`,
        },
    }
}
