import { AsyncLocalStorage } from 'node:async_hooks'

function run<T>({ title, fn }: { title: string, fn: () => Promise<T> }): Promise<T> {
    return storage.run({ title }, fn)
}

function currentTitle(): string | undefined {
    return storage.getStore()?.title
}

const storage = new AsyncLocalStorage<{ title: string }>()

export const taskContext = {
    run,
    currentTitle,
}
