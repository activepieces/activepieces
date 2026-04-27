import { FlowOperationType, FlowRun, FlowRunStatus, flowStructureUtil, isFlowRunStateTerminal, isNil, RunEnvironment, SampleDataFileType, StepOutputStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const POLL_INTERVAL_MS = 2000
const MAX_WAIT_MS = 120_000

export async function executeFlowTest({ flowId, projectId, stepName, triggerTestData, log }: {
    flowId: string
    projectId: string
    stepName?: string
    triggerTestData?: Record<string, unknown>
    log: FastifyBaseLogger
}): Promise<{ content: [{ type: 'text', text: string }] }> {
    let flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
    if (isNil(flow)) {
        return { content: [{ type: 'text', text: '❌ Flow not found' }] }
    }

    if (!flow.version.trigger.valid) {
        return { content: [{ type: 'text', text: '❌ Flow trigger is not configured. Use ap_update_trigger to set up the trigger before testing.' }] }
    }

    let warning = ''
    if (stepName) {
        const step = flowStructureUtil.getStep(stepName, flow.version.trigger)
        if (isNil(step)) {
            const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger).map(s => s.name).join(', ')
            return { content: [{ type: 'text', text: `❌ Step "${stepName}" not found. Available steps: ${allSteps}` }] }
        }
    }
    else {
        const invalidSteps = flowStructureUtil.getAllSteps(flow.version.trigger)
            .filter(s => !s.valid && !flowStructureUtil.isTrigger(s.type))
            .map(s => s.displayName)
        if (invalidSteps.length > 0) {
            warning = `⚠️ These steps are not fully configured: ${invalidSteps.join(', ')}. Results may be incomplete.\n\n`
        }
    }

    if (triggerTestData) {
        const project = await projectService(log).getOneOrThrow(projectId)
        const sampleDataSettings = await sampleDataService(log).saveSampleDataFileIdsInStep({
            projectId,
            flowVersionId: flow.version.id,
            stepName: flow.version.trigger.name,
            payload: triggerTestData,
            type: SampleDataFileType.OUTPUT,
        })
        const updatedFlow = await flowService(log).update({
            id: flow.id,
            projectId,
            userId: null,
            platformId: project.platformId,
            operation: {
                type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
                request: { stepName: flow.version.trigger.name, sampleDataSettings },
            },
        })
        flow = updatedFlow
    }

    const flowRun = await flowRunService(log).test({
        projectId,
        flowVersionId: flow.version.id,
        stepNameToTest: stepName,
    })

    const completedRun = await pollForRunCompletion(log, flowRun.id, projectId)

    if (!isFlowRunStateTerminal({ status: completedRun.status, ignoreInternalError: false })) {
        return {
            content: [{
                type: 'text',
                text: `⏳ Test still running after 120s. Run ID: ${completedRun.id} (status: ${completedRun.status}). Use ap_get_run to check results later.`,
            }],
        }
    }

    if (completedRun.status === FlowRunStatus.INTERNAL_ERROR && isNil(completedRun.steps)) {
        return {
            content: [{
                type: 'text',
                text: '❌ Test failed with INTERNAL_ERROR (no step data). Check that all steps are properly configured using ap_flow_structure.',
            }],
        }
    }

    return { content: [{ type: 'text', text: warning + formatRunResult(completedRun) }] }
}

export async function pollForRunCompletion(log: FastifyBaseLogger, runId: string, projectId: string): Promise<FlowRun> {
    const start = Date.now()
    while (Date.now() - start < MAX_WAIT_MS) {
        const run = await flowRunService(log).getOnePopulatedOrThrow({ id: runId, projectId })
        if (isFlowRunStateTerminal({ status: run.status, ignoreInternalError: false })) {
            return run
        }
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
    return flowRunService(log).getOnePopulatedOrThrow({ id: runId, projectId })
}

export function formatRunResult(run: FlowRun): string {
    const lines: string[] = []
    lines.push(`${statusIcon(run.status)} Run ${run.id} — ${run.status} (${formatDuration(run.startTime, run.finishTime)})`)
    lines.push(`  Flow: ${run.flowId} | Environment: ${run.environment}`)

    if (run.failedStep) {
        lines.push(`  Failed at: ${run.failedStep.displayName ?? run.failedStep.name}`)
    }

    const steps = run.steps
    if (!isNil(steps) && typeof steps === 'object') {
        lines.push('')
        lines.push('Steps:')
        for (const [name, step] of Object.entries(steps)) {
            lines.push(formatStepOutput(name, step))
        }
    }

    return lines.join('\n')
}

export function formatRunSummary(run: FlowRun): string {
    const env = run.environment === RunEnvironment.TESTING ? ' [TEST]' : ''
    const failed = run.failedStep ? ` | Failed: ${run.failedStep.displayName ?? run.failedStep.name}` : ''
    const dur = formatDuration(run.startTime, run.finishTime)
    const durStr = dur !== 'N/A' ? ` | ${dur}` : ''
    return `${statusIcon(run.status)} ${run.id} — ${run.status}${env}${durStr}${failed} | ${run.created}`
}

function statusIcon(status: FlowRunStatus): string {
    if (status === FlowRunStatus.SUCCEEDED) return '✅'
    if (status === FlowRunStatus.RUNNING || status === FlowRunStatus.QUEUED || status === FlowRunStatus.PAUSED) return '⏳'
    return '❌'
}

function formatDuration(startTime?: string | null, finishTime?: string | null): string {
    if (!startTime || !finishTime) return 'N/A'
    return `${((new Date(finishTime).getTime() - new Date(startTime).getTime()) / 1000).toFixed(1)}s`
}

function formatStepOutput(name: string, step: unknown): string {
    if (isNil(step) || typeof step !== 'object') {
        return `  - ${name}: (no data)`
    }

    const { status, duration, output, errorMessage } = step as Record<string, unknown>

    const icon = status === StepOutputStatus.SUCCEEDED ? '✅'
        : status === StepOutputStatus.FAILED ? '❌'
            : '⏳'
    const dur = typeof duration === 'number' ? ` (${(duration / 1000).toFixed(1)}s)` : ''

    const parts = [`  - ${icon} ${name}${dur}`]

    if (status === StepOutputStatus.FAILED && errorMessage !== undefined) {
        const errStr = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
        parts.push(`    Error: ${mcpUtils.truncate(errStr, 300)}`)
    }
    else if (output !== undefined) {
        const outStr = typeof output === 'string' ? output : JSON.stringify(output)
        parts.push(`    Output: ${mcpUtils.truncate(outStr, 500)}`)
    }

    return parts.join('\n')
}

