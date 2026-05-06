import {
    ApId,
    ApplicationEventName,
    PieceInstallFailure,
    PrincipalType,
    ProjectReplaceApplied,
    ProjectReplacePreflightError,
    ProjectReplaceRequest,
    ProjectReplaceResponse,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../../core/security/authorization/common'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../../helper/application-events'
import { projectReplaceService } from './project-replace.service'

export const projectReplaceController: FastifyPluginAsyncZod = async (app) => {
    app.post('/:projectId/replace', ReplaceProjectRequest, async (req, reply) => {
        const outcome = await projectReplaceService.replace({
            projectId: req.params.projectId,
            platformId: req.principal.platform.id,
            request: req.body,
            log: req.log,
        })

        switch (outcome.kind) {
            case 'LOCKED': {
                applicationEvents(req.log).sendUserEvent(req, {
                    action: ApplicationEventName.PROJECT_REPLACED,
                    data: {
                        sourceActivepiecesVersion: req.body.sourceActivepiecesVersion,
                        applied: emptyApplied(),
                        failedCount: 0,
                        outcome: 'LOCKED',
                        durationMs: outcome.durationMs,
                    },
                })
                return reply.status(StatusCodes.CONFLICT).send({
                    error: 'REPLACE_IN_PROGRESS',
                    retryAfter: 5,
                })
            }
            case 'PREFLIGHT_FAILED': {
                applicationEvents(req.log).sendUserEvent(req, {
                    action: ApplicationEventName.PROJECT_REPLACED,
                    data: {
                        sourceActivepiecesVersion: req.body.sourceActivepiecesVersion,
                        applied: emptyApplied(),
                        failedCount: outcome.errors.length,
                        outcome: 'PREFLIGHT_FAILED',
                        durationMs: outcome.durationMs,
                    },
                })
                return reply.status(StatusCodes.UNPROCESSABLE_ENTITY).send({
                    errors: outcome.errors,
                })
            }
            case 'INSTALL_FAILED': {
                applicationEvents(req.log).sendUserEvent(req, {
                    action: ApplicationEventName.PROJECT_REPLACED,
                    data: {
                        sourceActivepiecesVersion: req.body.sourceActivepiecesVersion,
                        applied: emptyApplied(),
                        failedCount: outcome.failures.length,
                        outcome: 'INSTALL_FAILED',
                        durationMs: outcome.durationMs,
                    },
                })
                return reply.status(StatusCodes.BAD_GATEWAY).send({
                    failures: outcome.failures,
                })
            }
            case 'SUCCESS':
            case 'PARTIAL_FAILURE': {
                applicationEvents(req.log).sendUserEvent(req, {
                    action: ApplicationEventName.PROJECT_REPLACED,
                    data: {
                        sourceActivepiecesVersion: req.body.sourceActivepiecesVersion,
                        applied: outcome.response.applied,
                        failedCount: outcome.response.failed.length,
                        outcome: outcome.kind,
                        durationMs: outcome.durationMs,
                    },
                })
                const status = outcome.kind === 'SUCCESS' ? StatusCodes.OK : StatusCodes.MULTI_STATUS
                return reply.status(status).send(outcome.response)
            }
        }
    })
}

function emptyApplied(): ProjectReplaceApplied {
    return {
        flowsCreated: 0,
        flowsUpdated: 0,
        flowsDeleted: 0,
        flowsUnchanged: 0,
        tablesCreated: 0,
        tablesUpdated: 0,
        tablesDeleted: 0,
        tablesUnchanged: 0,
        foldersCreated: 0,
        foldersUpdated: 0,
        foldersDeleted: 0,
        foldersUnchanged: 0,
        connectionsCreated: 0,
        connectionsUpdated: 0,
        connectionsUnchanged: 0,
    }
}

const ReplaceProjectRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.SERVICE],
            undefined,
            {
                type: ProjectResourceType.PARAM,
                paramKey: 'projectId',
            },
        ),
    },
    schema: {
        tags: ['project-replace'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            projectId: ApId,
        }),
        body: ProjectReplaceRequest,
        response: {
            [StatusCodes.OK]: ProjectReplaceResponse,
            [StatusCodes.MULTI_STATUS]: ProjectReplaceResponse,
            [StatusCodes.UNPROCESSABLE_ENTITY]: z.object({
                errors: z.array(ProjectReplacePreflightError),
            }),
            [StatusCodes.CONFLICT]: z.object({
                error: z.literal('REPLACE_IN_PROGRESS'),
                retryAfter: z.number(),
            }),
            [StatusCodes.BAD_GATEWAY]: z.object({
                failures: z.array(PieceInstallFailure),
            }),
        },
    },
}
