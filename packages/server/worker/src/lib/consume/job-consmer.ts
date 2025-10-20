import { assertNotNullOrUndefined, ConsumeJobResponse, ConsumeJobResponseStatus, JobData, WorkerJobType } from '@activepieces/shared'
import { context, propagation, trace } from '@opentelemetry/api'
import { Job } from 'bullmq'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { tokenUtls } from '../utils/token-utils'
import { agentJobExecutor } from './executors/agent-job-executor'
import { executeTriggerExecutor } from './executors/execute-trigger-executor'
import { flowJobExecutor } from './executors/flow-job-executor'
import { renewWebhookExecutor } from './executors/renew-webhook-executor'
import { userInteractionJobExecutor } from './executors/user-interaction-job-executor'
import { webhookExecutor } from './executors/webhook-job-executor'

const tracer = trace.getTracer('job-consumer')


export const jobConsmer = (log: FastifyBaseLogger) => ({
    async consumeJob(job: Job<JobData>, workerToken: string): Promise<ConsumeJobResponse> {
        const { id: jobId, data: jobData, attemptsStarted } = job
        assertNotNullOrUndefined(jobId, 'jobId')
        const timeoutInSeconds = getTimeoutForWorkerJob(jobData.jobType)
        const engineToken = await tokenUtls.generateEngineToken({ jobId, projectId: jobData.projectId!, platformId: jobData.platformId })
        const traceContext = ('traceContext' in jobData && jobData.traceContext) ? jobData.traceContext : {}
        const extractedContext = propagation.extract(context.active(), traceContext)

        return context.with(extractedContext, () => {
            return tracer.startActiveSpan('worker.consumeJob', {
                attributes: {
                    'worker.jobId': jobId,
                    'worker.jobType': jobData.jobType,
                    'worker.attemptsStarted': attemptsStarted,
                    'worker.projectId': jobData.projectId ?? 'unknown',
                },
            }, async (span) => {
                try {
                    switch (jobData.jobType) {
                        case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                        case WorkerJobType.EXECUTE_PROPERTY:
                        case WorkerJobType.EXECUTE_TOOL:
                        case WorkerJobType.EXECUTE_VALIDATION:
                        case WorkerJobType.EXECUTE_TRIGGER_HOOK:
                            await userInteractionJobExecutor(log).execute(jobData, engineToken, workerToken, timeoutInSeconds)
                            span.setAttribute('worker.completed', true)
                            return {
                                status: ConsumeJobResponseStatus.OK,
                            }
                        case WorkerJobType.EXECUTE_FLOW: {
                            const response = await flowJobExecutor(log).executeFlow({ jobData, attemptsStarted, engineToken, timeoutInSeconds })
                            span.setAttribute('worker.completed', true)
                            return response
                        }
                        case WorkerJobType.EXECUTE_POLLING: {
                            const response = await executeTriggerExecutor(log).executeTrigger({
                                jobId,
                                data: jobData,
                                engineToken,
                                workerToken,
                                timeoutInSeconds,
                            })
                            span.setAttribute('worker.completed', true)
                            return response

                        }
                        case WorkerJobType.RENEW_WEBHOOK: {
                            const response = await renewWebhookExecutor(log).renewWebhook({
                                data: jobData,
                                engineToken,
                                timeoutInSeconds,
                            })
                            span.setAttribute('worker.completed', true)
                            return response
                        }
                        case WorkerJobType.EXECUTE_WEBHOOK: {
                            span.setAttribute('worker.webhookExecution', true)
                            return await webhookExecutor(log).consumeWebhook(jobId, jobData, engineToken, workerToken, timeoutInSeconds)
                        }
                        case WorkerJobType.EXECUTE_AGENT: {
                            await agentJobExecutor(log).executeAgent({
                                jobData,
                                engineToken,
                                workerToken,
                            })
                            span.setAttribute('worker.completed', true)
                            return {
                                status: ConsumeJobResponseStatus.OK,
                            }
                        }
                    }
                }
                finally {
                    span.end()
                }
            })
        })
    },
})

const getTimeoutForWorkerJob = (jobType: WorkerJobType): number => {
    switch (jobType) {
        case WorkerJobType.EXECUTE_TRIGGER_HOOK:
        case WorkerJobType.RENEW_WEBHOOK:
            return dayjs.duration(workerMachine.getSettings().TRIGGER_HOOKS_TIMEOUT_SECONDS, 'seconds').asSeconds()
        case WorkerJobType.EXECUTE_WEBHOOK:
        case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
        case WorkerJobType.EXECUTE_TOOL:
        case WorkerJobType.EXECUTE_PROPERTY:
        case WorkerJobType.EXECUTE_VALIDATION:
        case WorkerJobType.EXECUTE_POLLING:
            return dayjs.duration(workerMachine.getSettings().TRIGGER_TIMEOUT_SECONDS, 'seconds').asSeconds()
        case WorkerJobType.EXECUTE_FLOW:
            return dayjs.duration(workerMachine.getSettings().FLOW_TIMEOUT_SECONDS, 'seconds').asSeconds()
        case WorkerJobType.EXECUTE_AGENT:
            return dayjs.duration(workerMachine.getSettings().AGENT_TIMEOUT_SECONDS, 'seconds').asSeconds()
    }
}