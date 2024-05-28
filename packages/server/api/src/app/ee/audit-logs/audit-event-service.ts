import { FastifyRequest } from 'fastify'
import { databaseConnection } from '../../database/database-connection'
import {
    ApplicationEventHooks,
    CreateAuditEventParam,
} from '../../helper/application-events'
import { extractClientRealIp } from '../../helper/network-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { getEdition } from '../../helper/secret-helper'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { AuditEventEntity } from './audit-event-entity'
import {
    ApplicationEvent,
    ApplicationEventName,
} from '@activepieces/ee-shared'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ApEdition,
    apId,
    assertNotNullOrUndefined,
    Cursor,
    isNil,
    PrincipalType,
    SeekPage,
} from '@activepieces/shared'

const auditLogRepo = databaseConnection.getRepository(AuditEventEntity)

type AuditLogService = {
    send: ApplicationEventHooks['send']
    list: (params: {
        platformId: string
        cursorRequest: Cursor | null
        limit: number
    }) => Promise<SeekPage<ApplicationEvent>>
}

export const auditLogService: AuditLogService = {
    send(request, rawEvent) {
        rejectedPromiseHandler(saveEvent(request, rawEvent))
    },
    async list({
        platformId,
        cursorRequest,
        limit,
    }: {
        platformId: string
        cursorRequest: Cursor | null
        limit: number
    }): Promise<SeekPage<ApplicationEvent>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: AuditEventEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const paginationResponse = await paginator.paginate(
            auditLogRepo.createQueryBuilder('audit_event').where({ platformId }),
        )
        return paginationHelper.createPage<ApplicationEvent>(
            paginationResponse.data,
            paginationResponse.cursor,
        )
    },
}

const saveEvent = async (
    request: FastifyRequest,
    rawEvent: CreateAuditEventParam,
) => {
    if ([PrincipalType.UNKNOWN, PrincipalType.WORKER].includes(request.principal.type)) {
        return
    }
    const platform = await platformService.getOneOrThrow(request.principal.platform.id)
    const edition = getEdition()
    if (!platform.auditLogEnabled && edition !== ApEdition.CLOUD) {
        return
    }
    const userInformation = await userService.getMetaInfo({
        id: rawEvent.userId,
    })
    assertNotNullOrUndefined(userInformation, 'UserInformation')
    if (isNil(userInformation.platformId)) {
        return
    }
    const project = await projectService.getOne(request.principal.projectId)

    const baseProps = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        userId: rawEvent.userId,
        projectId: project ? project.id : undefined,
        projectDisplayName: project ? project.displayName : undefined,
        userEmail: userInformation.email,
        platformId: userInformation.platformId!,
        ip: extractClientRealIp(request),
    }
    let eventToSave: ApplicationEvent | undefined
    switch (rawEvent.action) {
        case ApplicationEventName.USER_SIGNED_UP_USING_EMAIL:
        case ApplicationEventName.USER_SIGNED_UP_USING_SSO:
        case ApplicationEventName.USER_SIGNED_UP_USING_MANAGED_AUTH: {
            eventToSave = {
                ...baseProps,
                action: rawEvent.action,
                data: {
                    createdUser: {
                        id: rawEvent.createdUser.id,
                        email: rawEvent.createdUser.email,
                    },
                },
            }
            break
        }
        case ApplicationEventName.USER_SIGNED_IN:
        case ApplicationEventName.USER_PASSWORD_RESET:
        case ApplicationEventName.USER_EMAIL_VERIFIED: {
            eventToSave = {
                ...baseProps,
                action: rawEvent.action,
                data: {},
            }
            break
        }
        case ApplicationEventName.FLOW_UPDATED: {
            eventToSave = {
                ...baseProps,
                action: rawEvent.action,
                data: {
                    flowId: rawEvent.flow.id,
                    flowName: rawEvent.flow.version.displayName,
                    request: rawEvent.request,
                },
            }
            break
        }
        case ApplicationEventName.FLOW_CREATED:
        case ApplicationEventName.FLOW_DELETED: {
            eventToSave = {
                ...baseProps,
                action: rawEvent.action,
                data: {
                    flowId: rawEvent.flow.id,
                    flowName: rawEvent.flow.version.displayName,
                },
            }
            break
        }
        case ApplicationEventName.CONNECTION_UPSERTED:
        case ApplicationEventName.CONNECTION_DELETED: {
            eventToSave = {
                ...baseProps,
                action: rawEvent.action,
                data: {
                    connectionId: rawEvent.connection.id,
                    connectionName: rawEvent.connection.name,
                },
            }
            break
        }
        case ApplicationEventName.FOLDER_CREATED:
        case ApplicationEventName.FOLDER_UPDATED:
        case ApplicationEventName.FOLDER_DELETED: {
            eventToSave = {
                ...baseProps,
                action: rawEvent.action,
                data: {
                    folderId: rawEvent.folder.id,
                    folderName: rawEvent.folder.displayName,
                },
            }
            break
        }
        case ApplicationEventName.SIGNING_KEY_CREATED: {
            eventToSave = {
                ...baseProps,
                action: rawEvent.action,
                data: {
                    signingKeyId: rawEvent.signingKey.id,
                    signingKeyName: rawEvent.signingKey.displayName,
                },
            }
            break
        }
    }
    await auditLogRepo.save(eventToSave)
}
