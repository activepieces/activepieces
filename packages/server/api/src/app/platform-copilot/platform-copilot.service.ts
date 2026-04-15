import { generateText, LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { copilotSearchService } from './copilot-search.service'
import { createPlatformCopilotModel } from './create-model'

const SEARCH_LIMIT = 8

const ENHANCE_PROMPT = `You are a search query optimizer for the Activepieces codebase. Your ONLY job is to rewrite the user's message into a better search query.

Rules:
- Fix typos and spelling errors
- Expand abbreviations (e.g. "auth" → "authentication", "config" → "configuration")
- Add relevant technical terms that would help find the right code/docs
- Keep it concise — output a single search query, not a paragraph
- If the message is already clear, return it as-is with just typo fixes
- Output ONLY the improved query, nothing else — no explanation, no prefix, no quotes`

export const SYSTEM_PROMPT = `You are the Activepieces Assistant — an expert on Activepieces, the open-source workflow automation platform.

## Your tools
You have tools to read files and browse the codebase:
- **read_file** — read any file from the repo by path.
- **list_directory** — browse directory contents to find the right file.
Use tools whenever you need to look up code or documentation. NEVER say "I don't have access".

## CRITICAL RULES FOR CODE
- When showing file content, show the COMPLETE content. NEVER truncate with "// ... more code" or "// remaining logic".
- If a file is too large, show the relevant sections in full — do not summarize code.
- Always include the file path and line numbers when showing code.

## Response format
- Use markdown with fenced code blocks (\`\`\`typescript).
- Be concise in explanations but COMPLETE in code.
- Only answer Activepieces questions.

## RESOURCES
At the END of your response, include a "**Resources**" section ONLY if you actually read files or found relevant indexed content during this conversation turn. Follow these rules strictly:

1. ONLY link to files you actually accessed via read_file or that appeared in the retrieved context. NEVER guess or invent URLs.
2. If you did not read any file and no context was provided, do NOT include a Resources section at all.
3. Build URLs from the EXACT file paths you used:
   - If the path starts with \`docs/\`: strip the \`docs/\` prefix and the \`.md\`/\`.mdx\` extension, then use \`https://activepieces.com/docs/{remaining-path}\`
     Example: file path \`docs/get-started/introduction.mdx\` → \`https://activepieces.com/docs/get-started/introduction\`
   - For all other paths: use \`https://github.com/activepieces/activepieces/blob/main/{exact-path}\`
     Example: file path \`packages/server/api/src/app/app.ts\` → \`https://github.com/activepieces/activepieces/blob/main/packages/server/api/src/app/app.ts\`
4. Format:
   **Resources**
   - [File name or page title](url)

NEVER fabricate a URL. If unsure about a path, omit that link.`

export const platformCopilotService = (log: FastifyBaseLogger) => ({
    async prepareChat({ platformId, message, conversationHistory, modelId, provider }: ChatParams): Promise<PreparedChat> {
        const enhancedQuery = await enhanceQuery({ platformId, message, log, modelId, provider })
        log.info({ original: message, enhanced: enhancedQuery }, '[copilot] query enhanced')

        const results = await copilotSearchService(log).search({ query: enhancedQuery, limit: SEARCH_LIMIT })

        const contextBlock = results.length > 0
            ? results.map((r, idx) => `[${idx + 1}] File: ${r.filePath} (L${r.startLine}-L${r.endLine})\n\`\`\`${r.language ?? ''}\n${r.content}\n\`\`\``).join('\n\n---\n\n')
            : ''

        const { model } = await createPlatformCopilotModel({ platformId, log, modelId, provider })
        const systemWithContext = contextBlock
            ? `${SYSTEM_PROMPT}\n\n## Retrieved Context\n\n${contextBlock}`
            : SYSTEM_PROMPT

        const messages = [
            ...conversationHistory,
            { role: 'user' as const, content: message },
        ]

        return { model, systemWithContext, messages }
    },
})

async function enhanceQuery({ platformId, message, log, modelId, provider }: { platformId: string, message: string, log: FastifyBaseLogger, modelId?: string, provider?: string }): Promise<string> {
    try {
        const { model } = await createPlatformCopilotModel({ platformId, log, modelId, provider })
        const result = await generateText({
            model,
            system: ENHANCE_PROMPT,
            prompt: message,
            maxOutputTokens: 150,
        })
        const enhanced = result.text.trim()
        return enhanced.length > 0 ? enhanced : message
    }
    catch {
        return message
    }
}

type ChatParams = {
    platformId: string
    message: string
    conversationHistory: { role: 'user' | 'assistant', content: string }[]
    modelId?: string
    provider?: string
}

export type PreparedChat = {
    model: LanguageModel
    systemWithContext: string
    messages: { role: 'user' | 'assistant', content: string }[]
}
