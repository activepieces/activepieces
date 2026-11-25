import { z } from 'zod'

export enum BreakingChangeImpact {
    BLOCKS_UPGRADE = 'blocks-upgrade',
    FLOWS_FAIL = 'flows-fail',
    FLOWS_MAY_FAIL = 'flows-may-fail',
    BEHAVIOR_CHANGES = 'behavior-changes',
    FEATURE_REMOVED = 'feature-removed',
}

export enum BreakingChangeEdition {
    CE = 'ce',
    EE = 'ee',
}

export enum BreakingChangeInstallMethod {
    COMPOSE = 'compose',
    HELM = 'helm',
    KUBERNETES = 'kubernetes',
    ECS = 'ecs',
    OTHER = 'other',
}

export const BreakingChangeEntry = z.strictObject({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: z.string().min(1),
    added: z.iso.date(),
    order: z.number().int().optional(),
    release: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/).optional(),
    legacy: z.literal(true).optional(),
    impact: z.enum(BreakingChangeImpact).optional(),
    affects: z.strictObject({
        editions: z.array(z.enum(BreakingChangeEdition)).min(1),
        installMethods: z.array(z.enum(BreakingChangeInstallMethod)).min(1),
    }).optional(),
})

export type BreakingChangeEntry = z.infer<typeof BreakingChangeEntry>
