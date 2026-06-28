import { ActivepiecesError, ErrorCode, isNil, LocalesEnum } from '@activepieces/core-utils'
import { ActionBase, PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { ALL_PRINCIPAL_TYPES, EngineResponse, GetPieceRequestParams, GetPieceRequestQuery, GetPieceRequestWithScopeParams, ListPiecesRequestQuery, PieceAudienceFilter, PieceCategory, PieceOptionRequest, Principal, PrincipalType, RegistryPiecesRequestQuery, SampleDataFileType, WorkerJobType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowService } from '../../flows/flow/flow.service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { pieceSyncService } from '../piece-sync-service'
import { getPiecePackageWithoutArchive, pieceMetadataService } from './piece-metadata-service'

export const pieceModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(basePiecesController, { prefix: '/v1/pieces' })
}

const basePiecesController: FastifyPluginAsyncZod = async (app) => {

    app.get(
        '/categories',
        ListCategoriesRequest,
        async (): Promise<PieceCategory[]> => {
            return Object.values(PieceCategory)
        },
    )

    app.get('/', ListPiecesRequest, async (req): Promise<PieceMetadataModelSummary[]> => {
        const query = req.query

        const oldSyncCall = !isNil(query.release)
        if (oldSyncCall) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_SYNC_NOT_SUPPORTED,
                params: {
                    message: 'This endpoint is deprecated. Please use it without release parameter.',
                    release: query.release ?? '',
                },
            })
        }
        const includeTags = query.includeTags ?? false
        const platformId = getPlatformId(req.principal)
        const projectId = req.query.projectId
        const pieceMetadataSummary = await pieceMetadataService(req.log).list({
            includeHidden: query.includeHidden ?? false,
            projectId,
            platformId,
            includeTags,
            categories: query.categories,
            searchQuery: query.searchQuery,
            sortBy: query.sortBy,
            orderBy: query.orderBy,
            suggestionType: query.suggestionType,
            locale: query.locale as LocalesEnum | undefined,
        })
        const audience = query.audience ?? PieceAudienceFilter.HUMAN
        return pieceMetadataSummary.map((piece) => {
            const summary: PieceMetadataModelSummary = {
                ...piece,
                i18n: undefined,
            }
            return filterSummaryActionsByAudience(summary, audience)
        })
    })

    app.get(
        '/:scope/:name',
        GetPieceParamsWithScopeRequest,
        async (req) => {
            const { name, scope } = req.params
            const { version } = req.query

            const decodeScope = decodeURIComponent(scope)
            const decodedName = decodeURIComponent(name)
            const platformId = getPlatformId(req.principal)
            const piece = await pieceMetadataService(req.log).getOrThrow({
                platformId,
                name: `${decodeScope}/${decodedName}`,
                version,
                locale: req.query.locale as LocalesEnum | undefined,
            })
            return filterModelActionsByAudience(piece, req.query.audience ?? PieceAudienceFilter.HUMAN)
        },
    )

    app.get(
        '/:name',
        GetPieceParamsRequest,
        async (req): Promise<PieceMetadataModel> => {
            const { name } = req.params
            const { version } = req.query
            const decodedName = decodeURIComponent(name)
            const platformId = getPlatformId(req.principal)
            const piece = await pieceMetadataService(req.log).getOrThrow({
                platformId,
                name: decodedName,
                version,
                locale: req.query.locale as LocalesEnum | undefined,
            })
            return filterModelActionsByAudience(piece, req.query.audience ?? PieceAudienceFilter.HUMAN)
        },
    )

    app.get('/registry', RegistryPiecesRequest, async (req) => {
        const pieces = await pieceMetadataService(req.log).registry({
            release: req.query.release,
            platformId: getPlatformId(req.principal),
        })
        return pieces
    })

    app.post('/sync', SyncPiecesRequest, async (req) => pieceSyncService(req.log).sync({ publishCacheRefresh: true }))

    app.delete('/:id', DeletePieceRequest, async (req, reply) => {
        await pieceMetadataService(req.log).delete({
            id: req.params.id,
            platformId: req.principal.platform.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.post(
        '/options',
        OptionsPieceRequest,
        async (req) => {
            const projectId = req.projectId
            const platform = req.principal.platform
            const flow = await flowService(req.log).getOnePopulatedOrThrow({
                projectId,
                id: req.body.flowId,
                versionId: req.body.flowVersionId,
            })
            const sampleData = await sampleDataService(req.log).getSampleDataForFlow(projectId, flow.version, SampleDataFileType.OUTPUT)
            const { response } = await userInteractionWatcher.submitAndWaitForResponse<EngineResponse<unknown>>({
                jobType: WorkerJobType.EXECUTE_PROPERTY,
                platformId: platform.id,
                projectId,
                flowVersion: flow.version,
                propertyName: req.body.propertyName,
                actionOrTriggerName: req.body.actionOrTriggerName,
                input: req.body.input,
                sampleData,
                searchValue: req.body.searchValue,
                piece: await getPiecePackageWithoutArchive(req.log, platform.id, req.body),
            }, req.log)
            return response
        },
    )

}

function getPlatformId(principal: Principal): string | undefined {
    return principal.type === PrincipalType.WORKER || principal.type === PrincipalType.UNKNOWN || principal.type === PrincipalType.ONBOARDING ? undefined : principal.platform?.id
}

// Whether an action is visible for the requested audience perspective. `both`-tagged and
// untagged actions (untagged defaults to `both`) are always visible; only the opposite single
// audience is hidden. ALL keeps everything.
const isActionVisibleForAudience = (action: ActionBase, audience: PieceAudienceFilter): boolean => {
    if (audience === PieceAudienceFilter.ALL) {
        return true
    }
    if (audience === PieceAudienceFilter.AI) {
        return action.audience !== 'human'
    }
    return action.audience !== 'ai'
}

// Filter actions out of the human-facing responses at the HTTP boundary so internal callers
// (flow validation, MCP, tool-search reindex) that use the metadata service directly still see
// the full set. Callers pick a perspective with ?audience= (defaults to HUMAN).
function filterModelActionsByAudience(piece: PieceMetadataModel, audience: PieceAudienceFilter): PieceMetadataModel {
    if (audience === PieceAudienceFilter.ALL) {
        return piece
    }
    return {
        ...piece,
        actions: Object.fromEntries(
            Object.entries(piece.actions).filter(([, action]) => isActionVisibleForAudience(action, audience)),
        ),
    }
}

// The summary carries suggestedActions only when the caller requests action suggestions
// (suggestionType ACTION/ACTION_AND_TRIGGER) — the path the flow-builder picker uses. There we
// filter the entries and recompute the count, so a piece with no actions for the perspective
// reports 0 and drops out of the picker. Without suggestedActions there is no per-action data to
// filter, so the count is left as the raw total (informational — the bare list is not where the
// human UI reads per-piece counts, and no action records are exposed). A fully audience-aware
// count would have to live in the metadata service, which is intentionally left untouched.
function filterSummaryActionsByAudience(piece: PieceMetadataModelSummary, audience: PieceAudienceFilter): PieceMetadataModelSummary {
    if (audience === PieceAudienceFilter.ALL || isNil(piece.suggestedActions)) {
        return piece
    }
    const visibleSuggestedActions = piece.suggestedActions.filter((action) => isActionVisibleForAudience(action, audience))
    const hiddenActionCount = piece.suggestedActions.length - visibleSuggestedActions.length
    return {
        ...piece,
        suggestedActions: visibleSuggestedActions,
        actions: piece.actions - hiddenActionCount,
    }
}

const RegistryPiecesRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        querystring: RegistryPiecesRequestQuery,
    },
}

const ListPiecesRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        querystring: ListPiecesRequestQuery,

    },

}
const GetPieceParamsRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: GetPieceRequestParams,
        querystring: GetPieceRequestQuery,
    },
}

const GetPieceParamsWithScopeRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: GetPieceRequestWithScopeParams,
        querystring: GetPieceRequestQuery,
    },
}

const ListCategoriesRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: ListPiecesRequestQuery,
    },
}

const OptionsPieceRequest = {
    schema: {
        body: PieceOptionRequest,
    },
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.BODY,
        }),
    },
}

const SyncPiecesRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const DeletePieceRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['pieces'],
        params: z.object({
            id: z.string(),
        }),
    },
}
