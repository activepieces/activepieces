import { isNil } from '@activepieces/core-utils'
import { CreateScimGroupRequest, DefaultProjectRole, parseScimFilter, ProjectType, ReplaceScimGroupRequest, SCIM_GROUP_SCHEMA, SCIM_LIST_RESPONSE_SCHEMA, ScimError, ScimGroupMember, ScimGroupResource, ScimListResponse, ScimPatchRequest, UserStatus } from '@activepieces/shared'

import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { In } from 'typeorm'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { userIdentityHelper } from '../../helper/user-identity-helper'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userRepo, userService } from '../../user/user-service'
import { platformProjectService } from '../projects/platform-project-service'
import { ProjectMemberEntity } from '../projects/project-members/project-member.entity'
import { projectMemberService } from '../projects/project-members/project-member.service'

const projectMemberRepo = repoFactory(ProjectMemberEntity)

export const scimGroupService = (log: FastifyBaseLogger) => ({
    async create(params: {
        platformId: string
        request: CreateScimGroupRequest
    }): Promise<ScimGroupResource> {
        const { platformId, request } = params

        const platform = await platformService(log).getOneOrThrow(platformId)

        // no need for existing check, because SCIM will check if the group already exists and use PUT instead of POST
        const project = await projectService(log).create({
            displayName: request.displayName,
            ownerId: platform.ownerId,
            platformId,
            externalId: request.externalId,
            type: ProjectType.TEAM,
        })

        if (!isNil(request.members) && request.members.length > 0) {
            await Promise.all(
                request.members.map(async (member) =>
                    addMemberToProject({
                        userId: member.value,
                        projectId: project.id,
                        platformId,
                        log,
                    })),
            )
        }

        const members = await getProjectMembers(project.id, platformId, log)
        return toScimGroupResource(project.id, project.displayName, project.externalId ?? undefined, members, project.created, project.updated)
    },

    async getById(params: {
        platformId: string
        projectId: string
    }): Promise<ScimGroupResource> {
        const { platformId, projectId } = params
        const project = await projectService(log).getOne(projectId)

        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'Project not found',
            )
        }

        const members = await getProjectMembers(projectId, platformId, log)
        return toScimGroupResource(project.id, project.displayName, project.externalId ?? undefined, members, project.created, project.updated)
    },

    async list(params: {
        platformId: string
        filter?: string
        startIndex?: number
        count?: number
    }): Promise<ScimListResponse> {
        const { platformId, filter, startIndex = 1, count = 100 } = params

        const filterDisplayName = parseScimFilter(filter, 'displayName')

        if (!isNil(filterDisplayName)) {
            const project = await projectService(log).getByPlatformIdAndExternalId({
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

            const members = await getProjectMembers(project.id, platformId, log)
            const resource = toScimGroupResource(project.id, project.displayName, project.externalId ?? undefined, members, project.created, project.updated)
            return {
                schemas: [SCIM_LIST_RESPONSE_SCHEMA],
                totalResults: 1,
                startIndex,
                itemsPerPage: count,
                Resources: [resource],
            }
        }

        const projects = await projectService(log).getAllForUser({
            platformId,
            userId: '', // We pass isPrivileged=true so userId is not used
            isPrivileged: true,
        })

        const teamProjects = projects.filter(p => p.type === ProjectType.TEAM)

        const paginatedProjects = teamProjects.slice(startIndex - 1, startIndex - 1 + count)

        const scimGroups: ScimGroupResource[] = await Promise.all(
            paginatedProjects.map(async (project) => {
                const members = await getProjectMembers(project.id, platformId, log)
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
        const project = await projectService(log).getOne(projectId)

        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'Project not found',
            )
        }

        await projectService(log).update(projectId, {
            type: ProjectType.TEAM,
            displayName: request.displayName,
            externalId: request.externalId,
        })

        const members = await replaceMembers({
            projectId,
            platformId,
            newMembers: request.members as ScimGroupMember[],
            log,
        })

        const updatedProject = await projectService(log).getOneOrThrow(projectId)
        return toScimGroupResource(updatedProject.id, updatedProject.displayName, updatedProject.externalId ?? undefined, members, updatedProject.created, updatedProject.updated)
    },

    async patch(params: {
        platformId: string
        projectId: string
        request: ScimPatchRequest
    }): Promise<ScimGroupResource> {
        const { platformId, projectId, request } = params
        const project = await projectService(log).getOne(projectId)

        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'Project not found',
            )
        }

        for (const operation of request.Operations) {
            const op = operation.op.toLowerCase()

            if (op === 'add' && operation.path === 'members') {
                const memberValues = operation.value as ScimGroupMember[]
                await Promise.all(
                    memberValues.map(member =>
                        addMemberToProject({
                            userId: member.value,
                            projectId,
                            platformId,
                            log,
                        }),
                    ),
                )
            }
            else if (op === 'remove' && !isNil(operation.path) && operation.path.startsWith('members')) {
                const match = operation.path.match(/members\[value\s+eq\s+"([^"]+)"\]/i)
                if (match) {
                    const userId = match[1]
                    await removeMemberFromProject({
                        userId,
                        projectId,
                        platformId,
                        log,
                    })
                }
            }
            else if (op === 'replace') {
                // Handle path-based replace (e.g., path: "displayName", value: "New Name")
                if (operation.path === 'displayName' && !isNil(operation.value)) {
                    await projectService(log).update(projectId, {
                        type: ProjectType.TEAM,
                        displayName: operation.value as string,
                    })
                }
                else if (isNil(operation.path) && !isNil(operation.value) && typeof operation.value === 'object') {
                    // Handle value-based replace (e.g., value: { displayName: "New Name", members: [...] })
                    const value = operation.value as Record<string, unknown>
                    if ('displayName' in value) {
                        await projectService(log).update(projectId, {
                            type: ProjectType.TEAM,
                            displayName: value.displayName as string,
                        })
                    }

                    // Handle replace on members (full replacement)
                    if ('members' in value) {
                        await replaceMembers({
                            projectId,
                            platformId,
                            newMembers: value.members as ScimGroupMember[],
                            log,
                        })
                    }
                }
            }
        }

        const updatedProject = await projectService(log).getOneOrThrow(projectId)
        const members = await getProjectMembers(projectId, platformId, log)
        return toScimGroupResource(updatedProject.id, updatedProject.displayName, updatedProject.externalId ?? undefined, members, updatedProject.created, updatedProject.updated)
    },

    async delete(params: {
        platformId: string
        projectId: string
    }): Promise<void> {
        const { platformId, projectId } = params
        const project = await projectService(log).getOne(projectId)
       
        if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'Project not found',
            )
        }

        await platformProjectService(log).markForDeletion({
            id: projectId,
            platformId,
        })
    },
})

async function addMemberToProject(params: {
    userId: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const { userId, projectId, platformId, log } = params

    const user = await userService(log).get({ id: userId })
    if (isNil(user) || user.platformId !== platformId || user.status !== UserStatus.ACTIVE) {
        return
    }

    const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
    if (userIdentityHelper(log).isEmbeddedIdentity(identity)) {
        return
    }

    const role = system.get<DefaultProjectRole>(AppSystemProp.SCIM_DEFAULT_PROJECT_ROLE) ?? DefaultProjectRole.EDITOR

    await projectMemberService(log).upsert({
        userId,
        projectId,
        projectRoleName: role,
    })
}

async function removeMemberFromProject(params: {
    userId: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const { userId, projectId, platformId, log } = params

    const user = await userService(log).get({ id: userId })
    if (!isNil(user)) {
        const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
        if (userIdentityHelper(log).isEmbeddedIdentity(identity)) {
            return
        }
    }

    const member = await projectMemberRepo().findOneBy({
        userId,
        projectId,
        platformId,
    })

    if (!isNil(member)) {
        await projectMemberRepo().delete({ id: member.id })
    }
}

async function getProjectMembers(projectId: string, platformId: string, log: FastifyBaseLogger): Promise<ScimGroupMember[]> {
    const members = await projectMemberRepo().find({
        where: { projectId, platformId },
    })
    if (members.length === 0) {
        return []
    }

    const memberUsers = await userRepo().find({
        where: { id: In(members.map((member) => member.userId)), platformId },
        relations: { identity: true },
    })

    return memberUsers
        .filter((user) => !userIdentityHelper(log).isEmbeddedIdentity(user.identity))
        .map((user) => ({
            value: user.id,
            display: user.identity.email,
            $ref: `/scim/v2/Users/${user.id}`,
        }))
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

/**
 * Receives a list of updated members and replaces the existing members with the new members.
 * Deletes the existing members that are not in the new list.
 * Adds the new members to the project.
 * Returns the final list of members.
 */
async function replaceMembers(params: {
    projectId: string
    platformId: string
    newMembers: ScimGroupMember[] | undefined
    log: FastifyBaseLogger
}): Promise<ScimGroupMember[]> {
    const { projectId, platformId, newMembers, log } = params

    const requestedMembers = newMembers ?? []
    const requestedMemberIds = new Set(requestedMembers.map((member) => member.value))
    const visibleMembers = await getProjectMembers(projectId, platformId, log)
    const membersToDelete = visibleMembers.filter((member) => !requestedMemberIds.has(member.value))

    await Promise.all(
        requestedMembers.map(async (member) =>
            addMemberToProject({
                userId: member.value,
                projectId,
                platformId,
                log,
            })),
    )

    await Promise.all(
        membersToDelete.map(async (member) =>
            removeMemberFromProject({
                userId: member.value,
                projectId,
                platformId,
                log,
            })),
    )

    return getProjectMembers(projectId, platformId, log)
}