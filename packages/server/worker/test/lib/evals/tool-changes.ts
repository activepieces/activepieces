import { cryptoUtils } from '@activepieces/server-utils'
import { asSchema, ToolSet } from 'ai'
import { EvalCase } from './eval-case'
import { replay } from './replay'

async function fingerprints({ tools }: { tools: ToolSet }): Promise<ToolFingerprints> {
    const entries = await Promise.all(Object.entries(tools).map(async ([name, tool]) => {
        const definition = JSON.stringify({ description: tool.description ?? '', inputSchema: await asSchema(tool.inputSchema).jsonSchema })
        return [name, cryptoUtils.hashSHA256(definition).slice(0, HASH_CHARS)] as const
    }))
    return Object.fromEntries(entries)
}

function changed({ before, now }: { before: ToolFingerprints, now: ToolFingerprints }): string[] {
    const names = new Set([...Object.keys(before), ...Object.keys(now)])
    return [...names].filter((name) => before[name] !== now[name]).sort()
}

function touches({ evalCase, changedTools }: { evalCase: EvalCase, changedTools: string[] }): boolean {
    const used = new Set([...evalCase.recordedToolCalls.map((call) => call.toolName), ...(evalCase.targetTool === undefined ? [] : [evalCase.targetTool])])
    return changedTools.some((name) => used.has(name))
}

function untested({ evalCase, changedTools }: { evalCase: EvalCase, changedTools: string[] }): string[] {
    const recorded = new Set(evalCase.recordedToolCalls.map((call) => call.toolName).filter((name) => !replay.isLive(name)))
    return changedTools.filter((name) => recorded.has(name))
}

const HASH_CHARS = 16

export const toolChanges = {
    fingerprints,
    changed,
    touches,
    untested,
}

export type ToolFingerprints = Record<string, string>
