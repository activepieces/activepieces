import { pubsub } from '../helper/pubsub'

const GATE_TIMEOUT_MS = 5 * 60 * 1000
const CHANNEL_PREFIX = 'tool-approval:'

function channelName(gateId: string): string {
    return `${CHANNEL_PREFIX}${gateId}`
}

async function waitForApproval({ gateId }: { gateId: string }): Promise<boolean> {
    const channel = channelName(gateId)

    return new Promise<boolean>((resolve) => {
        let settled = false

        const cleanup = () => {
            if (settled) return
            settled = true
            void pubsub.unsubscribe(channel)
        }

        const timeout = setTimeout(() => {
            cleanup()
            resolve(false)
        }, GATE_TIMEOUT_MS)

        void pubsub.subscribe(channel, (message) => {
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
