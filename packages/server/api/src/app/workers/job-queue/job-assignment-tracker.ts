import { isNil } from '@activepieces/core-utils'

// Tracks which in-flight job each connected worker holds. The app moves a job to BullMQ `active`
// when a worker polls — BEFORE the worker has received/started it — so a job orphaned by a
// disconnect can be sitting in `active` that the worker itself never saw and could never drain.
// Only the app knows it dispatched that job, so on disconnect the broker reads the worker's jobs
// back from here and returns them to the queue, instead of leaving them in `active` for the
// minutes-long stalled-scan (which is what inflated active past concurrency during deploys).
// A worker's poll / completeJob / disconnect all land on the same app instance, so this in-memory
// map is authoritative for that instance; the stalled-scan backstops an app-instance crash.

const assignmentByJobId = new Map<string, JobAssignment>()
const jobIdsByWorkerId = new Map<string, Set<string>>()

export const jobAssignmentTracker = {
    record(params: { workerId: string, jobId: string, token: string, queueName: string }): void {
        const { workerId, jobId, token, queueName } = params
        assignmentByJobId.set(jobId, { workerId, token, queueName })
        const existing = jobIdsByWorkerId.get(workerId)
        if (existing) {
            existing.add(jobId)
        }
        else {
            jobIdsByWorkerId.set(workerId, new Set([jobId]))
        }
    },
    clear(jobId: string): void {
        const assignment = assignmentByJobId.get(jobId)
        if (isNil(assignment)) {
            return
        }
        assignmentByJobId.delete(jobId)
        const workerJobs = jobIdsByWorkerId.get(assignment.workerId)
        if (isNil(workerJobs)) {
            return
        }
        workerJobs.delete(jobId)
        if (workerJobs.size === 0) {
            jobIdsByWorkerId.delete(assignment.workerId)
        }
    },
    takeByWorker(workerId: string): TakenAssignment[] {
        const jobIds = jobIdsByWorkerId.get(workerId)
        if (isNil(jobIds)) {
            return []
        }
        jobIdsByWorkerId.delete(workerId)
        const taken: TakenAssignment[] = []
        for (const jobId of jobIds) {
            const assignment = assignmentByJobId.get(jobId)
            if (isNil(assignment)) {
                continue
            }
            assignmentByJobId.delete(jobId)
            taken.push({ jobId, token: assignment.token, queueName: assignment.queueName })
        }
        return taken
    },
    reset(): void {
        assignmentByJobId.clear()
        jobIdsByWorkerId.clear()
    },
}

type JobAssignment = { workerId: string, token: string, queueName: string }
type TakenAssignment = { jobId: string, token: string, queueName: string }
