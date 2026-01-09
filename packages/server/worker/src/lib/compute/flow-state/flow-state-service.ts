import { apDayjsDuration } from "@activepieces/server-shared"
import { parseToJsonIfPossible, StepRunResponse, StepExecutionPath, isNil, SaveStepOutputRequest, GetStepOutputRequest, StepOutput } from "@activepieces/shared"
import { Level } from "level"
import path from "path"
import { workerDistributedLock } from "../../utils/worker-redis"
import { FastifyBaseLogger } from "fastify"

const WORKER_LEVELDB_PATH = path.resolve('worker-db')
const UPLOAD_INTERVAL = apDayjsDuration(5, "second").asMilliseconds()
const registeredRuns: Set<string> = new Set()
let interval: NodeJS.Timeout;
let repo = new Level(WORKER_LEVELDB_PATH, { valueEncoding: 'json' })

export const flowStateService = (log: FastifyBaseLogger) => ({

    init: async () => {
      await repo.open();
      if (!isNil(interval)) return;
      interval = setInterval(async () => {
        await Promise.all(
          Array.from(registeredRuns).map((runId) =>
            workerDistributedLock(log).runExclusive({
              key: `flow-state-${runId}`,
              timeoutInSeconds: 10,
              fn: () => flowStateService(log).upload(runId),
            })
          )
        )
      }, UPLOAD_INTERVAL);
    },

    save: async ({ stepOutput, runId, path, stepName }: SaveStepOutputRequest) => {
      registeredRuns.add(runId)
      console.error("save", stepOutput, stepName)
      await repo.put(stepKey(stepName, path, runId), JSON.stringify(stepOutput))
    },

    get: async ({ stepName, path, runId }: GetStepOutputRequest) => {
      const res = await repo.get(stepKey(stepName, path, runId))
      const step = parseToJsonIfPossible(res) as StepOutput
      console.error("get", step)
      return step
    },

    upload: async (runId: string) => {

    },

    clear: async () => {
      await repo.clear()
      if (interval) clearInterval(interval)
    }
})

const stepKey = (
  stepName: string, 
  path: StepExecutionPath,
  runId: string, 
) => {
  if (path.length === 0) {
    return `${stepName}-${runId}`
  }
   const pathString = path
   .map(([loopName, iteration]) => `${loopName}:${iteration}`)
   .join(':')
 
 return `${pathString}:${stepName}-${runId}`
}
