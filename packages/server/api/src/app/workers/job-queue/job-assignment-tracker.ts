import { isNil } from '@activepieces/core-utils'

// Tracks which in-flight job each worker CONNECTION holds. The app moves a job to BullMQ `active`
// when a worker polls — BEFORE the worker has received/started it — so a job orphaned by a
// disconnect can be sitting in `active` that the worker itself never saw and could never drain.
// Only the app knows it dispatched that job, so on disconnect the broker reads that connection's
// jobs back from here and returns them to the queue, instead of leaving them in `active` for the
// minutes-long stalled-scan (which is what inflated active past concurrency during deploys).
// A connection's poll / completeJob / disconnect all land on the same app instance, so this
// in-memory map is authoritative for that instance; the stalled-scan backstops an app-instance crash.
//
// Keyed by the per-connection socket id, NOT the stable workerId: a worker keeps the same workerId
// across Socket.IO reconnects, so a late `disconnect` for an old socket — fired after the worker has
// already reconnected and polled fresh jobs — would otherwise reclaim those fresh jobs out from under
// the live connection. Scoping to the socket id means an old socket's disconnect only reclaims its
// own jobs. Assignments themselves are keyed by (queueName, jobId) so the same job id on the shared
// and a worker-group queue can't clobber each other's token.

const assignmentByKey = new Map<string, JobAssignment>()
const keysByConnectionId = new Map<string, Set<string>>()

export const jobAssignmentTracker = {
    record(params: { connectionId: string, jobId: string, token: string, queueName: string }): void {
        const { connectionId, jobId, token, queueName } = params
        const key = keyOf(queueName, jobId)
        assignmentByKey.set(key, { connectionId, jobId, token, queueName })
        const existing = keysByConnectionId.get(connectionId)
        if (existing) {
            existing.add(key)
        }
        else {
            keysByConnectionId.set(connectionId, new Set([key]))
        }
    },
    clear(params: { jobId: string, queueName: string }): void {
        const key = keyOf(params.queueName, params.jobId)
        const assignment = assignmentByKey.get(key)
        if (isNil(assignment)) {
            return
        }
        assignmentByKey.delete(key)
        const connectionKeys = keysByConnectionId.get(assignment.connectionId)
        if (isNil(connectionKeys)) {
            return
        }
        connectionKeys.delete(key)
        if (connectionKeys.size === 0) {
            keysByConnectionId.delete(assignment.connectionId)
        }
    },
    takeByConnection(connectionId: string): TakenAssignment[] {
        const keys = keysByConnectionId.get(connectionId)
        if (isNil(keys)) {
            return []
        }
        keysByConnectionId.delete(connectionId)
        const taken: TakenAssignment[] = []
        for (const key of keys) {
            const assignment = assignmentByKey.get(key)
            if (isNil(assignment)) {
                continue
            }
            assignmentByKey.delete(key)
            taken.push({ jobId: assignment.jobId, token: assignment.token, queueName: assignment.queueName })
        }
        return taken
    },
    reset(): void {
        assignmentByKey.clear()
        keysByConnectionId.clear()
    },
}

function keyOf(queueName: string, jobId: string): string {
    return `${queueName} ${jobId}`
}

type JobAssignment = { connectionId: string, jobId: string, token: string, queueName: string }
type TakenAssignment = { jobId: string, token: string, queueName: string }
