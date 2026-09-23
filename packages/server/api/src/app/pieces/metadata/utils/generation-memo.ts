import { isNil } from '@activepieces/core-utils'

export function createGenerationMemo<V>({ currentGeneration }: CreateGenerationMemoParams): GenerationMemo<V> {
    let generation: number | null = null
    let entries = new Map<string, Promise<V>>()
    return {
        get({ key, load }): Promise<V> {
            const requested = currentGeneration()
            if (requested !== generation) {
                generation = requested
                entries = new Map()
            }
            const existing = entries.get(key)
            if (!isNil(existing)) {
                return existing
            }
            const owner = entries
            const pending = load()
            owner.set(key, pending)
            pending.catch(() => {
                if (owner.get(key) === pending) {
                    owner.delete(key)
                }
            })
            return pending
        },
    }
}

type CreateGenerationMemoParams = {
    currentGeneration: () => number
}

export type GenerationMemo<V> = {
    get(params: { key: string, load: () => Promise<V> }): Promise<V>
}
