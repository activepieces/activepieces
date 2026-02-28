import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion, Nullable } from '../../../core/common/base-model'
import { BranchCondition, CodeActionSchema, FlowAction, FlowActionKind, LoopOnItemsActionSchema, PieceActionSchema, RouterActionSchema } from '../actions/action'
import { EmptyTrigger, FlowTrigger, FlowTriggerKind, PieceTrigger } from '../triggers/trigger'

export enum FlowNodeType {
    TRIGGER = 'trigger',
    ACTION = 'action',
}

export enum FlowEdgeType {
    DEFAULT = 'default',
    BRANCH = 'branch',
    LOOP = 'loop',
}

export const FlowNodeData = DiscriminatedUnion('kind', [
    CodeActionSchema,
    PieceActionSchema,
    LoopOnItemsActionSchema,
    RouterActionSchema,
    EmptyTrigger,
    PieceTrigger,
])

export type FlowNodeData = Static<typeof FlowNodeData>

export const FlowGraphNode = Type.Object({
    id: Type.String(),
    type: Type.Enum(FlowNodeType),
    data: FlowNodeData,
})

export type FlowGraphNode = Static<typeof FlowGraphNode>

export const DefaultEdge = Type.Object({
    id: Type.String(),
    source: Type.String(),
    target: Type.String(),
    type: Type.Literal(FlowEdgeType.DEFAULT),
})

export type DefaultEdge = Static<typeof DefaultEdge>

export const BranchEdge = Type.Object({
    id: Type.String(),
    source: Type.String(),
    target: Nullable(Type.String()),
    type: Type.Literal(FlowEdgeType.BRANCH),
    branchIndex: Type.Number(),
    branchName: Type.String(),
    branchType: Type.Union([
        Type.Literal('CONDITION'),
        Type.Literal('FALLBACK'),
    ]),
    conditions: Type.Optional(Type.Array(Type.Array(BranchCondition))),
})

export type BranchEdge = Static<typeof BranchEdge>

export const LoopEdge = Type.Object({
    id: Type.String(),
    source: Type.String(),
    target: Nullable(Type.String()),
    type: Type.Literal(FlowEdgeType.LOOP),
})

export type LoopEdge = Static<typeof LoopEdge>

export const FlowGraphEdge = Type.Union([DefaultEdge, BranchEdge, LoopEdge])

export type FlowGraphEdge = Static<typeof FlowGraphEdge>

export const FlowGraph = Type.Object({
    nodes: Type.Array(FlowGraphNode),
    edges: Type.Array(FlowGraphEdge),
})

export type FlowGraph = Static<typeof FlowGraph>

export type FlowNodeKind = FlowActionKind | FlowTriggerKind

export function isActionNodeData(data: FlowNodeData): data is FlowAction {
    return data.kind === FlowActionKind.CODE
        || data.kind === FlowActionKind.PIECE
        || data.kind === FlowActionKind.LOOP_ON_ITEMS
        || data.kind === FlowActionKind.ROUTER
}

export function isTriggerNodeData(data: FlowNodeData): data is FlowTrigger {
    return data.kind === FlowTriggerKind.EMPTY
        || data.kind === FlowTriggerKind.PIECE
}
