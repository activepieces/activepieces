const subscriptions = new Map<
string,
((channel: string, message: string) => void)[]
>()

export const memoryPubSub = {
    async subscribe(
        channel: string,
        listener: (channel: string, message: string) => void,
    ): Promise<void> {
        if (!subscriptions.has(channel)) {
            subscriptions.set(channel, [])
        }
        subscriptions.get(channel)?.push(listener)
    },

    async publish(channel: string, message: string): Promise<void> {
        const listeners = subscriptions.get(channel)
        if (listeners) {
            listeners.forEach((listener) => listener(channel, message))
        }
    },
    async unsubscribe(channel: string): Promise<void> {
        subscriptions.delete(channel)
    },
}
