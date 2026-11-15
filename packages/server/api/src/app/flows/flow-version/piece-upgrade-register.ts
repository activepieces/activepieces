import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'

export const pieceUpgradeRegister = {
    lookup: async ({ pieceName, pieceVersion, log }: LookupParams): Promise<PieceUpgradeRegisterEntry | undefined> => {
        if (isNil(cachedRegister)) {
            cachedRegister = loadRegister(log)
        }
        const register = await cachedRegister
        return register.pieces[pieceName]?.[pieceVersion]
    },
    resolveDecision: ({ entry, usedStepName }: ResolveDecisionParams): PieceUpgradeRegisterDecision => {
        if (entry.unsafeSteps?.includes(usedStepName)) {
            return { outcome: 'kept' }
        }
        return { outcome: 'upgraded', toVersion: entry.target }
    },
}

const REGISTER_PATH = path.resolve('packages/server/api/src/assets/piece-upgrade-register.json')

let cachedRegister: Promise<PieceUpgradeRegisterFile> | null = null

async function loadRegister(log: FastifyBaseLogger): Promise<PieceUpgradeRegisterFile> {
    const { data, error } = await tryCatch(async () => {
        const content = await readFile(REGISTER_PATH, 'utf-8')
        const register: PieceUpgradeRegisterFile = JSON.parse(content)
        return register
    })
    if (!isNil(error) || isNil(data)) {
        log.error({ error, registerPath: REGISTER_PATH }, '[pieceUpgradeRegister] failed to load register, keeping all piece versions')
        return { pieces: {} }
    }
    return data
}

export type PieceUpgradeRegisterEntry = {
    target: string
    unsafeSteps?: string[]
}

export type PieceUpgradeRegisterDecision =
    | { outcome: 'upgraded', toVersion: string }
    | { outcome: 'kept' }

type PieceUpgradeRegisterFile = {
    pieces: Record<string, Record<string, PieceUpgradeRegisterEntry>>
}

type LookupParams = {
    pieceName: string
    pieceVersion: string
    log: FastifyBaseLogger
}

type ResolveDecisionParams = {
    entry: PieceUpgradeRegisterEntry
    usedStepName: string
}
