import { chatAiUtils } from '@activepieces/server-utils'
import { AIProviderName } from '@activepieces/shared'
import { generateText } from 'ai'

const JUDGE_SYSTEM = 'You are a strict binary evaluator of an AI assistant transcript. You judge exactly ONE dimension against ONE pass criterion. Be conservative: if the criterion is not clearly met, answer FAIL. Respond with "PASS" or "FAIL" on the first line, then a single short sentence explaining why on the second line. Output nothing else.'

function createJudge({ provider, modelId, auth }: {
    provider: AIProviderName
    modelId: string
    auth: Record<string, unknown>
}): { judge: (params: { dimension: string, rubric: string, transcript: string }) => Promise<JudgeVerdict> } {
    const model = chatAiUtils.createChatModel({ provider, auth, config: {}, modelId })

    const judge = async ({ dimension, rubric, transcript }: { dimension: string, rubric: string, transcript: string }): Promise<JudgeVerdict> => {
        const { text } = await generateText({
            model,
            temperature: 0,
            system: JUDGE_SYSTEM,
            prompt: `Dimension: ${dimension}\nPass criterion: ${rubric}\n\n--- TRANSCRIPT START ---\n${transcript}\n--- TRANSCRIPT END ---`,
        })
        const lines = text.trim().split('\n')
        const pass = /^\s*pass\b/i.test(lines[0] ?? '')
        const reason = (lines.slice(1).join(' ').trim() || lines[0] || '').trim()
        return { pass, reason }
    }

    return { judge }
}

export const llmJudge = {
    create: createJudge,
}

export type JudgeVerdict = {
    pass: boolean
    reason: string
}
