import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { LanguageModel, stepCountIs, ToolLoopAgent, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { chatToolCategories } from '../tools/chat-tool-categories'

const RESEARCHER_MAX_STEPS = 15

const RESEARCHER_SYSTEM_PROMPT = readFileSync(
    path.resolve('packages/server/api/src/assets/prompts/chat-researcher-prompt.md'),
    'utf8',
)

function filterResearchTools({ allTools }: { allTools: ToolSet }): ToolSet {
    return chatToolCategories.filterTools({ allTools, predicate: chatToolCategories.isResearchPhaseTool })
}

async function executeResearch({ model, researchTools, providerOptions, task, log }: ExecuteResearchParams): Promise<ResearchResult> {
    const agent = new ToolLoopAgent({
        model,
        instructions: RESEARCHER_SYSTEM_PROMPT,
        tools: researchTools,
        providerOptions,
        stopWhen: stepCountIs(RESEARCHER_MAX_STEPS),
        onStepFinish: ({ stepNumber, finishReason }) => {
            log.debug({ stepNumber, finishReason }, 'Researcher step finished')
        },
    })

    const result = await agent.generate({ prompt: task })

    return {
        findings: result.text,
        stepsUsed: result.steps.length,
    }
}

type ExecuteResearchParams = {
    model: LanguageModel
    researchTools: ToolSet
    providerOptions: SharedV3ProviderOptions
    task: string
    log: FastifyBaseLogger
}

type ResearchResult = {
    findings: string
    stepsUsed: number
}

export const researcherAgent = {
    executeResearch,
    filterResearchTools,
}

