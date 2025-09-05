

export type ConsumerManager = {
    init(): Promise<void>
    close(): Promise<void>
    run(): Promise<void>
}