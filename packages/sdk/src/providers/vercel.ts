import { z } from 'zod'
import { ProjectSession } from '../session'

/**
 * Vercel AI SDK provider. Returns a tool set keyed by tool name, each carrying a Zod
 * `parameters` schema and an `execute` handler — pass it straight to `generateText` /
 * `streamText({ tools })`, where the AI SDK runs the loop for you.
 */
export function toVercelTools(session: ProjectSession) {
    return Object.fromEntries(session.tools().map((tool) => [
        tool.name,
        {
            description: tool.description,
            parameters: z.object(tool.inputSchema),
            execute: (args: Record<string, unknown>) => tool.execute(args),
        },
    ]))
}
