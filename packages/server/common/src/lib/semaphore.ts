export class ApSemaphore {
    private maxConcurrent: number
    private queue: (() => void)[]
    private currentConcurrent: number

    constructor(maxConcurrent: number) {
        this.maxConcurrent = maxConcurrent
        this.queue = []
        this.currentConcurrent = 0
    }

    async acquire() {
        if (this.currentConcurrent >= this.maxConcurrent) {
            await new Promise<void>((resolve) => this.queue.push(resolve))
        }
        this.currentConcurrent++
    }

    release() {
        this.currentConcurrent--
        if (this.queue.length > 0) {
            const nextResolver = this.queue.shift()
            nextResolver?.()
        }
    }
}