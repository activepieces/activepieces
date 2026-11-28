import { tryCatch } from '@activepieces/core-utils'

const disposables = new Set<OperationDisposable>()

export const operationScope = {
    track(disposable: OperationDisposable): void {
        disposables.add(disposable)
    },
    async disposeAll(): Promise<void> {
        const pending = [...disposables]
        disposables.clear()
        await Promise.all(pending.map((disposable) => tryCatch(() => disposable.dispose())))
    },
}

export type OperationDisposable = {
    dispose(): Promise<void>
}
