import { redisConnections } from '../database/redis-connections'
import { pubsub } from '../helper/pubsub'

const GATE_TIMEOUT_MS = 5 * 60 * 1000
const CHANNEL_PREFIX = 'tool-approval:'

function channelName(gateId: string): string {
    return `${CHANNEL_PREFIX}${gateId}`
}

async function waitForApproval({ gateId }: { gateId: string }): Promise<boolean> {
    const channel = channelName(gateId)
    const subscriber = await redisConnections.create()

    return new Promise<boolean>((resolve) => {
        let settled = false

        const cleanup = () => {
            if (settled) return
            settled = true
            subscriber.unsubscribe(channel).then(() => subscriber.quit()).catch(() => undefined)
        }

        const timeout = setTimeout(() => {
            cleanup()
            resolve(false)
        }, GATE_TIMEOUT_MS)

        subscriber.on('message', (_ch, message) => {
            if (_ch !== channel) return
            clearTimeout(timeout)
            cleanup()
            try {
                const parsed = JSON.parse(message)
                resolve(parsed.approved === true)
            }
            catch {
                resolve(false)
            }
        })

        void subscriber.subscribe(channel)
    })
}

async function resolveGate({ gateId, approved }: { gateId: string, approved: boolean }): Promise<void> {
    const channel = channelName(gateId)
    await pubsub.publish(channel, JSON.stringify({ approved }))
}

export const chatApprovalGate = {
    waitForApproval,
    resolveGate,
}
