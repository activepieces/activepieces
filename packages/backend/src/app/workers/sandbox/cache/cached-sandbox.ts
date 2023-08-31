import { mkdir } from 'node:fs/promises'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { CachedSandboxState } from './cached-sandbox-state'
import { pieceManager } from '../../../flows/common/piece-installer'
import { SandBoxCacheType } from '../provisioner/sandbox-cache-type'
import { engineInstaller } from '../../engine/engine-installer'

const CACHE_PATH = system.get(SystemProp.CACHE_PATH) ?? '/usr/src/cache'

export class CachedSandbox {
    public readonly key: string
    private _cacheType: SandBoxCacheType
    private _state = CachedSandboxState.CREATED

    constructor({ key, type }: CtorParams) {
        this.key = key
        this._cacheType = type
    }

    public get state(): CachedSandboxState {
        return this._state
    }

    path(): string {
        return `${CACHE_PATH}/sandbox/${this.key}`
    }

    async init(): Promise<void> {
        if (this._state !== CachedSandboxState.CREATED) {
            return
        }

        await mkdir(this.path(), { recursive: true })
        this._state = CachedSandboxState.INITIALIZED
    }

    async prepare({ pieces }: PrepareParams): Promise<void> {
        const notInitialized = this._state === CachedSandboxState.CREATED
        if (notInitialized) {
            throw new Error(`[CachedSandbox#prepare] not initialized, Key=${this.key} state=${this._state}`)
        }

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
