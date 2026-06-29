import { SdkTool } from '../tools/meta-tools'

export async function runTool(tools: SdkTool[], name: string, rawArgs: unknown): Promise<string> {
    const tool = tools.find((candidate) => candidate.name === name)
    if (tool === undefined) {
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
    try {
        const result = await tool.execute(parseArgs(rawArgs))
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    }
    catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : String(error) })
    }
}

function parseArgs(rawArgs: unknown): Record<string, unknown> {
    if (typeof rawArgs === 'string') {
        try {
            return JSON.parse(rawArgs)
        }
        catch {
            return {}
        }
    }
    return rawArgs !== null && typeof rawArgs === 'object' ? rawArgs as Record<string, unknown> : {}
}
