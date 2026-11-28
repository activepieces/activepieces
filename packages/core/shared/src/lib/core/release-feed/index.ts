import { z } from 'zod'
import { BreakingChangeEdition, BreakingChangeImpact, BreakingChangeInstallMethod } from '../breaking-change'

export enum ReleaseKind {
    MINOR = 'minor',
    PATCH = 'patch',
    HOTFIX = 'hotfix',
    RC = 'rc',
}

export const ReleaseTag = z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/)

export const ReleaseNote = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    impact: z.enum(BreakingChangeImpact).optional(),
    affects: z.object({
        editions: z.array(z.enum(BreakingChangeEdition)).min(1),
        installMethods: z.array(z.enum(BreakingChangeInstallMethod)).min(1),
    }).optional(),
    body: z.string().min(1),
})

export const ReleaseMigrations = z.object({
    blocking: z.number().int().min(0),
    background: z.number().int().min(0),
    breaking: z.array(z.string()),
})

export const ReleasePieceMigration = z.object({
    piece: z.string().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
})

export const ReleaseFeedEntry = z.object({
    tag: ReleaseTag,
    releasedAt: z.iso.datetime(),
    line: z.string().regex(/^\d+\.\d+$/),
    kind: z.enum(ReleaseKind),
    imageDigest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    avoid: z.object({
        reason: z.string().min(1),
    }).optional(),
    releaseNotes: z.string().min(1).optional(),
    migrations: ReleaseMigrations,
    notes: z.array(ReleaseNote),
    pieceMigrations: z.array(ReleasePieceMigration),
    supportedUntil: z.iso.date().nullable(),
})

export const ReleaseFeed = z.array(ReleaseFeedEntry)

export const ReleaseNoteFile = z.strictObject({
    version: ReleaseTag,
    avoid: z.string().min(1).optional(),
})

export const GetReleaseFeedResponse = z.object({
    fetchedAt: z.iso.datetime().nullable(),
    entries: ReleaseFeed,
})

export type ReleaseNote = z.infer<typeof ReleaseNote>
export type ReleaseMigrations = z.infer<typeof ReleaseMigrations>
export type ReleasePieceMigration = z.infer<typeof ReleasePieceMigration>
export type ReleaseFeedEntry = z.infer<typeof ReleaseFeedEntry>
export type ReleaseFeed = z.infer<typeof ReleaseFeed>
export type ReleaseNoteFile = z.infer<typeof ReleaseNoteFile>
export type GetReleaseFeedResponse = z.infer<typeof GetReleaseFeedResponse>
