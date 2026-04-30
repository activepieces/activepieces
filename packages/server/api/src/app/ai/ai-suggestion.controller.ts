import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { isNil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { pieceMetadataService } from '../pieces/metadata/piece-metadata-service'

export const aiSuggestionController: FastifyPluginAsyncZod = async (app) => {
    app.post('/suggest', {
        ...SuggestAction,
        config: {
            ...SuggestAction.config,
            rateLimit: {
                max: 10,
                timeWindow: '1 minute',
            },
        },
    }, async (request) => {
        const { workloadContext } = request.body
        const log = app.log

        // Sanitize query to prevent prompt injection and control character issues
        const query = request.body.query.replace(/[\n\r`"]/g, ' ').trim()

        // Fallback to environment variable for surgical fix
        const openAIApiKey = process.env.AP_AI_SUGGESTION_OPENAI_API_KEY
        if (isNil(openAIApiKey)) {
            return { suggestions: [], tokensUsed: 0, processingTimeMs: 0 }
        }

        const startTime = Date.now()
        const openai = createOpenAI({
            apiKey: openAIApiKey,
        })

        const pieces = await pieceMetadataService(log).list({
            includeHidden: false,
            platformId: request.principal.platform.id,
        })

        const existingPieceNames = pieces.map(p => p.name)
        const validatedExistingPieces = workloadContext?.existingPieces?.filter(p => existingPieceNames.includes(p)) || []

        const contextPrefix = validatedExistingPieces.length
            ? `Current workflow already uses: ${validatedExistingPieces.join(', ')}. `
            : ''

        const basePrompt = `You are an AI assistant for Activepieces, a workflow automation tool. Given a user's natural language description, suggest relevant actions from the available pieces.

RULES:
1. Only suggest actions that EXACTLY match the available pieces listed below.
2. If no action matches, return an empty array.
3. Provide confidence scores (0.0-1.0) based on clarity of match.
4. Suggest parameter values when obvious from context (e.g., "send email to John" -> to: "john@example.com").
5. Consider workflow context if provided.
6. Return STRICT JSON only.

AVAILABLE PIECES:
`

        const userQueryPart = `\n\n${contextPrefix}USER QUERY: "${query}"`

        // Token limit management - simple estimation (4 chars per token)
        let piecesString = ''
        const MAX_TOKENS = 3000
        for (const p of pieces) {
            const pieceStr = `PIECE: "${p.displayName}" (id: "${p.name}")\nDESCRIPTION: ${(p.description || '').substring(0, 100)}\n\n`
            if ((piecesString + pieceStr).length / 4 > MAX_TOKENS) break
            piecesString += pieceStr
        }

        const systemPrompt = basePrompt + piecesString + userQueryPart

        let text = ''
        let totalTokens = 0

        try {
            const result = await generateText({
                model: openai('gpt-3.5-turbo-1106'),
                prompt: systemPrompt,
                temperature: 0.2,
            })
            text = result.text
            totalTokens = result.usage.totalTokens
        }
        catch (e) {
            log.error(e, '[ai-suggestion.controller] AI generation failed')
            return { suggestions: [], tokensUsed: 0, processingTimeMs: Date.now() - startTime }
        }

        let suggestions: ActionSuggestion[] = []
        try {
            const jsonStr = text.replace(/^```json\n?|\n?```$/g, '').trim()
            const parsed = JSON.parse(jsonStr)
            if (Array.isArray(parsed.suggestions)) {
                suggestions = parsed.suggestions
            }
            else if (Array.isArray(parsed)) {
                suggestions = parsed
            }
        }
        catch (e) {
            log.error(e, '[ai-suggestion.controller] Failed to parse AI response')
        }

        // Resolve P1: Validate AI-suggested piece names against the actual DB piece list
        const validatedSuggestions = suggestions.filter(s => existingPieceNames.includes(s.pieceName))

        return {
            suggestions: validatedSuggestions.map(s => ({
                pieceName: s.pieceName,
                actionName: s.actionName,
                confidence: s.confidence,
                suggestedParameters: s.suggestedParameters || {},
                reasoning: s.reasoning || '',
            })),
            tokensUsed: totalTokens,
            processingTimeMs: Date.now() - startTime,
        }
    })
}

const SuggestAction = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: z.object({
            query: z.string().max(500),
            workloadContext: z.object({
                existingPieces: z.array(z.string().max(100)).max(1000).optional(),
                stepIndex: z.number().optional(),
            }).optional(),
        }),
        response: {
            [StatusCodes.OK]: z.object({
                suggestions: z.array(z.object({
                    pieceName: z.string(),
                    actionName: z.string(),
                    confidence: z.number().min(0).max(1),
                    suggestedParameters: z.record(z.unknown()),
                    reasoning: z.string(),
                })),
                tokensUsed: z.number(),
                processingTimeMs: z.number(),
            }),
        },
    },
}

interface ActionSuggestion {
    pieceName: string
    actionName: string
    confidence: number
    suggestedParameters: Record<string, unknown>
    reasoning: string
}
