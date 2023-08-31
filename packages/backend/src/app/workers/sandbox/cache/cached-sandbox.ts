import { mkdir } from 'node:fs/promises'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { CachedSandboxState } from './cached-sandbox-state'
import { pieceManager } from '../../../flows/common/piece-installer'
import { SandBoxCacheType } from '../provisioner/sandbox-cache-type'
import { engineInstaller } from '../../engine/engine-installer'
import { logger } from '../../../helper/logger'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'

const CACHE_PATH = system.get(SystemProp.CACHE_PATH) ?? '/usr/src/cache'

const lock: Mutex = new Mutex()

export class CachedSandbox {
    public readonly key: string
    private _cacheType: SandBoxCacheType
    private _state = CachedSandboxState.CREATED
    private _activeSandboxCount = 0
    private _lastUsedAt = dayjs()

    constructor({ key, type }: CtorParams) {
        logger.debug({ key, type }, '[CachedSandbox#ctor]')
        this.key = key
        this._cacheType = type
    }

    path(): string {
        return `${CACHE_PATH}/sandbox/${this.key}`
    }

    lastUsedAt(): dayjs.Dayjs {
        return this._lastUsedAt
    }

    async init(): Promise<void> {
        logger.debug({ key: this.key, state: this._state, activeSandboxes: this._activeSandboxCount }, '[CachedSandbox#init]')

        if (this._state !== CachedSandboxState.CREATED) {
            return
        }

        await mkdir(this.path(), { recursive: true })
        this._state = CachedSandboxState.INITIALIZED
    }

    async prepare({ pieces }: PrepareParams): Promise<void> {
        logger.debug({ key: this.key, state: this._state, activeSandboxes: this._activeSandboxCount }, '[CachedSandbox#prepare]')

        const notInitialized = this._state === CachedSandboxState.CREATED
        if (notInitialized) {
            throw new Error(`[CachedSandbox#prepare] not initialized, Key=${this.key} state=${this._state}`)
        }

        this.incrementActiveSandboxCount()
        this._lastUsedAt = dayjs()

        const alreadyPrepared = this._state !== CachedSandboxState.INITIALIZED
        if (alreadyPrepared) {
            return
        }

        await pieceManager.install({
            projectPath: this.path(),
            pieces,
        })

        if (this._cacheType !== SandBoxCacheType.CODE) {
            await engineInstaller.install({
                path: this.path(),
            })
        }

        this._state = CachedSandboxState.READY
    }

    private async incrementActiveSandboxCount(): Promise<void> {
        logger.debug({ key: this.key, state: this._state, activeSandboxes: this._activeSandboxCount }, '[CachedSandbox#incrementActiveSandboxCount]')

        const releaseLock = await lock.acquire()

        try {
            this._activeSandboxCount += 1
        }
        finally {
            releaseLock()
        }
    }

    async decrementActiveSandboxCount(): Promise<void> {
        logger.debug({ key: this.key, state: this._state, activeSandboxes: this._activeSandboxCount }, '[CachedSandbox#decrementActiveSandboxCount]')

        const releaseLock = await lock.acquire()

        try {
            if (this._activeSandboxCount === 0) {
                return
            }

            this._activeSandboxCount -= 1
        }
        finally {
            releaseLock()
        }
    }

    isInUse(): boolean {
        return this._activeSandboxCount > 0
    }
}

type CtorParams = {
    key: string
    type: SandBoxCacheType
}

type Piece = {
    name: string
    version: string
}

type PrepareParams = {
    pieces: Piece[]
}
