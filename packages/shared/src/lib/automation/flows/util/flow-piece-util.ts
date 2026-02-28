import semver from 'semver'
import { FlowActionKind } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowGraph, FlowGraphNode } from '../graph/flow-graph'
import { FlowTriggerKind } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'

export const flowPieceUtil = {
    makeFlowAutoUpgradable(flowVersion: FlowVersion): FlowVersion {
        return flowStructureUtil.transferFlow(flowVersion, (node) => {
            const clonedNode: FlowGraphNode = JSON.parse(JSON.stringify(node))
            if (clonedNode.data.kind === FlowActionKind.PIECE || clonedNode.data.kind === FlowTriggerKind.PIECE) {
                clonedNode.data.settings.pieceVersion = flowPieceUtil.getMostRecentPatchVersion(clonedNode.data.settings.pieceVersion)
            }
            return clonedNode
        })
    },
    getExactVersion(pieceVersion: string): string {
        if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
            return pieceVersion.slice(1)
        }
        return pieceVersion
    },
    getUsedPieces(flowVersion: { graph: FlowGraph }): string[] {
        return flowStructureUtil.getAllSteps(flowVersion)
            .filter((node) => node.data.kind === FlowActionKind.PIECE || node.data.kind === FlowTriggerKind.PIECE)
            .map((node) => {
                if (node.data.kind === FlowActionKind.PIECE || node.data.kind === FlowTriggerKind.PIECE) {
                    return node.data.settings.pieceName
                }
                return ''
            })
            .filter(Boolean)
    },
    getMostRecentPatchVersion(pieceVersion: string): string {
        if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
            return pieceVersion
        }
        if (semver.valid(pieceVersion) && semver.lt(pieceVersion, '1.0.0')) {
            return `~${pieceVersion}`
        }
        return `^${pieceVersion}`
    },
}
