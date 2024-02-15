import {
    FlowId,
    ProjectId,
    flowHelper,
    TriggerType,
    ActionType,
    isNil,
    ApEdition,
    FlowStatus,
} from '@activepieces/shared'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { CloudPieceMetadataService } from './cloud-piece-metadata-service'
import { flagService } from '../../flags/flag.service'

type PieceStats = {
    activeSteps: number
    allSteps: number
    allProjects: number
    activeProjects: number
    allFlows: number
    activeFlows: number
}

export type AllPiecesStats = Record<string, PieceStats>

let cachedStats: AllPiecesStats = {}
let cacheTime: number
const TWENTY_FOUR_HOURS_IN_MILLISECONDS = 24 * 60 * 60 * 1000

export const pieceStatsService = {
    async get(): Promise<AllPiecesStats> {
        const pieceMetaService = CloudPieceMetadataService()
        if (
            cachedStats &&
      Date.now() - cacheTime < TWENTY_FOUR_HOURS_IN_MILLISECONDS
        ) {
            return cachedStats
        }
        const flows = await flowRepo().find()
        const stats: Record<string, PieceStats> = {}
        const uniqueStatsPerPiece: Record<
        string,
        {
            flows: Set<FlowId>
            projects: Set<ProjectId>
            activeprojects: Set<ProjectId>
            activeFlows: Set<FlowId>
        }
        > = {}
        const defaultStats = {
            activeSteps: 0,
            allSteps: 0,
            allProjects: 0,
            activeFlows: 0,
            allFlows: 0,
            activeProjects: 0,
        }
        const pieces = await pieceMetaService.list({
            release: await flagService.getCurrentRelease(),
            projectId: undefined,
            edition: ApEdition.ENTERPRISE,
            includeHidden: true,
        })
        for (const piece of pieces) {
            uniqueStatsPerPiece[piece.name] = {
                flows: new Set(),
                projects: new Set(),
                activeprojects: new Set(),
                activeFlows: new Set(),
            }
            stats[piece.name] = { ...defaultStats }
        }
        for (const flowWithoutVersion of flows) {
            const flow = await flowService.getOnePopulatedOrThrow({
                id: flowWithoutVersion.id,
                projectId: flowWithoutVersion.projectId,
            })
            if (isNil(flow.version)) {
                continue
            }
            const trigger = flow.version.trigger
            if (isNil(trigger)) {
                continue
            }
            const steps = flowHelper.getAllSteps(flow.version.trigger)
            for (const step of steps) {
                if (step.type === TriggerType.PIECE || step.type === ActionType.PIECE) {
                    if (!stats[step.settings.pieceName]) {
                        uniqueStatsPerPiece[step.settings.pieceName] = {
                            flows: new Set(),
                            projects: new Set(),
                            activeprojects: new Set(),
                            activeFlows: new Set(),
                        }
                        stats[step.settings.pieceName] = { ...defaultStats }
                    }
                    uniqueStatsPerPiece[step.settings.pieceName].projects.add(
                        flow.projectId,
                    )
                    uniqueStatsPerPiece[step.settings.pieceName].flows.add(flow.id)
                    stats[step.settings.pieceName].allSteps++
                    if (flow.status === FlowStatus.ENABLED) {
                        uniqueStatsPerPiece[step.settings.pieceName].activeFlows.add(
                            flow.id,
                        )
                        uniqueStatsPerPiece[step.settings.pieceName].activeprojects.add(
                            flow.projectId,
                        )
                        stats[step.settings.pieceName].activeSteps++
                    }
                }
            }
        }
        for (const pieceName in uniqueStatsPerPiece) {
            stats[pieceName].allProjects =
        uniqueStatsPerPiece[pieceName].projects.size
            stats[pieceName].activeProjects =
        uniqueStatsPerPiece[pieceName].activeprojects.size
            stats[pieceName].allFlows = uniqueStatsPerPiece[pieceName].flows.size
            stats[pieceName].activeFlows =
        uniqueStatsPerPiece[pieceName].activeFlows.size
        }
        cachedStats = Object.entries(stats)
            .sort(
                ([, valueA], [, valueB]) =>
                    valueB.activeProjects - valueA.activeProjects,
            )
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

        cacheTime = Date.now()
        return stats
    },
}
