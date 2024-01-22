import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { CachedSandboxState } from './cached-sandbox-state'
import { pieceManager } from '../../../flows/common/piece-manager'
import { engineInstaller } from '../../engine/engine-installer'
import { logger } from '../../../helper/logger'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import { PiecePackage, SourceCode } from '@activepieces/shared'
import { codeBuilder } from '../../code-worker/code-builder'
import { enrichErrorContext } from '../../../helper/error-handler'
import { packageManager } from '../../../helper/package-manager'

export class CachedSandbox {
    private static readonly CACHE_PATH = system.get(SystemProp.CACHE_PATH) ?? resolve('dist', 'cache')

    private readonly lock = new Mutex()
    private _state = CachedSandboxState.CREATED
    private _activeSandboxCount = 0
    private _lastUsedAt = dayjs()

    public readonly key: string

    constructor({ key }: CtorParams) {
        logger.debug({ key }, '[CachedSandbox#ctor]')
        this.key = key
    }

    path(): string {
        return `${CachedSandbox.CACHE_PATH}/sandbox/${this.key}`
    }

    lastUsedAt(): dayjs.Dayjs {
        return this._lastUsedAt
    }

    isInUse(): boolean {
        return this._activeSandboxCount > 0
    }

    async init(): Promise<void> {
        logger.debug({ key: this.key, state: this._state, activeSandboxes: this._activeSandboxCount }, '[CachedSandbox#init]')

        await this.lock.runExclusive(async (): Promise<void> => {
            if (this._state !== CachedSandboxState.CREATED) {
                return
            }

            await this.deletePathIfExists()
            await mkdir(this.path(), { recursive: true })

            this._state = CachedSandboxState.INITIALIZED
        })
    }

    async prepare({ projectId, pieces, codeSteps = [] }: PrepareParams): Promise<void> {
        logger.debug({ key: this.key, state: this._state, activeSandboxes: this._activeSandboxCount }, '[CachedSandbox#prepare]')

        try {
            await this.lock.runExclusive(async (): Promise<void> => {
                const notInitialized = this._state === CachedSandboxState.CREATED
                if (notInitialized) {
                    throw new Error(`[CachedSandbox#prepare] not initialized, Key=${this.key} state=${this._state}`)
                }

                this._activeSandboxCount += 1
                this._lastUsedAt = dayjs()

                const alreadyPrepared = this._state !== CachedSandboxState.INITIALIZED
                if (alreadyPrepared) {
                    return
                }

                await packageManager.init({ path: this.path() })

                await pieceManager.install({
                    projectId,
                    projectPath: this.path(),
                    pieces,
                })

                await engineInstaller.install({
                    path: this.path(),
                })

                await this.buildCodeArchives(codeSteps)

                this._state = CachedSandboxState.READY
            })
        }
        catch (error) {
            const contextKey = '[CachedSandbox#prepare]'
            const contextValue = {
                args: { pieces, codeSteps },
                state: this._state,
                activeSandboxes: this._activeSandboxCount,
                key: this.key,
                lastUsedAt: this.lastUsedAt(),
                isInUse: this.isInUse(),
                path: this.path(),
            }

            const enrichedError = enrichErrorContext({
                error,
                key: contextKey,
                value: contextValue,
            })

            throw enrichedError
        }
    }

    async decrementActiveSandboxCount(): Promise<void> {
        logger.debug({ key: this.key, state: this._state, activeSandboxes: this._activeSandboxCount }, '[CachedSandbox#decrementActiveSandboxCount]')

        await this.lock.runExclusive((): void => {
            if (this._activeSandboxCount === 0) {
                return
            }

            this._activeSandboxCount -= 1
        })
    }

    private deletePathIfExists(): Promise<void> {
        return rm(this.path(), { recursive: true, force: true })
    }

    private async buildCodeArchives(codeArchives: CodeArtifact[]): Promise<void> {
        const buildJobs = codeArchives.map((archive) =>
            codeBuilder.processCodeStep({
                sourceCodeId: archive.name,
                sourceCode: archive.sourceCode,
                buildPath: this.path(),
            }),
        )
        await Promise.all(buildJobs)
    }
}

type CtorParams = {
    key: string
}

type CodeArtifact = {
    name: string
    sourceCode: SourceCode
}

type PrepareParams = {
    projectId: string
    pieces: PiecePackage[]
    codeSteps?: CodeArtifact[]
}
