import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { isNil } from 'lodash';

// Constants for caching and prompt management
const suggestionCache = new Map<string, { suggestions: ActionSuggestion[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PROMPT_TOKENS = 3500;
const MAX_DESCRIPTION_LENGTH = 100;

/**
 * Estimates the token count for a given text.
 * This is a simple estimation and might not be perfectly accurate compared to actual LLM tokenizers.
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token per 4 characters + count words
  return Math.ceil(text.length / 4) + text.split(/\s+/).filter(Boolean).length;
}

/**
 * Sets up an AI suggestion endpoint for Activepieces.
 * This function should be called during the Activepieces backend initialization,
 * for example, in `packages/server/src/app.ts` or a similar main server file.
 *
 * Example integration:
 * ```typescript
 * import { setupAISuggestionEndpoint } from './app/ai-suggestion/ai-suggestion-backend';
 * import { app, pieces } from './app'; // Assuming 'app' is your Express app and 'pieces' is your global piece registry
 * import { env } from '@activepieces/node-server/src/app/helper/env'; // Example for env access
 *
 * // ... other app setup
 *
 * // Ensure OpenAI API key is available
 * const openAIApiKey = env.get('OPENAI_API_KEY'); // Replace with actual environment variable key
 * if (openAIApiKey) {
 *   setupAISuggestionEndpoint(app, pieces, openAIApiKey);
 * } else {
 *   console.warn('OpenAI API key not found. AI suggestion endpoint will not be enabled.');
 * }
 * ```
 *
 * @param app The Express application instance.
 * @param pieces An array of available Activepieces pieces.
 * @param openAIApiKey Your OpenAI API key.
 * @param enableCache Whether to enable caching for suggestions. Defaults to true.
 */
export function setupAISuggestionEndpoint(
  app: express.Express,
  pieces: APPiece[],
  openAIApiKey: string,
  enableCache: boolean = true
): void {
  const openai = new OpenAI({ apiKey: openAIApiKey });
  const router = express.Router();

  // Create an efficient lookup index for pieces and actions
  const actionIndex = new Map<string, Map<string, APAction>>();
  pieces.forEach(piece => {
    const actionsMap = new Map<string, APAction>();
    piece.actions.forEach(action => {
      actionsMap.set(action.name, action);
    });
    actionIndex.set(piece.name, actionsMap);
  });

  // Flatten actions for easier iteration and prompt construction
  const flattenedActions: Array<{ pieceName: string; pieceDisplay: string; action: APAction }> = [];
  pieces.forEach(piece => {
    piece.actions.forEach(action => {
      flattenedActions.push({
        pieceName: piece.name,
        pieceDisplay: piece.displayName,
        action
      });
    });
  });

  router.post('/api/ai/suggest', async (req: Request<{}, {}, SuggestionRequest>, res: Response<SuggestionResponse>) => {
    const startTime = Date.now();
    const { query, workloadContext } = req.body;

    // Basic input validation
    if (isNil(query) || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ suggestions: [], tokensUsed: 0, processingTimeMs: Date.now() - startTime });
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `${normalizedQuery}-${JSON.stringify(workloadContext || {})}`;

    // Check cache if enabled
    if (enableCache) {
      const cached = suggestionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        return res.json({
          suggestions: cached.suggestions,
          tokensUsed: 0, // Indicate cached response with 0 tokens used
          processingTimeMs: Date.now() - startTime
        });
      }
    }

    try {
      // Construct the system prompt
      const contextPrefix = workloadContext?.existingPieces?.length
        ? `Current workflow already uses: ${workloadContext.existingPieces.join(', ')}. `
        : '';

      const basePrompt = `You are an AI assistant for Activepieces, a workflow automation tool. Given a user's natural language description, suggest relevant actions from the available pieces.

RULES:
1. Only suggest actions that EXACTLY match the available pieces and actions listed below.
2. If no action matches, return an empty array.
3. Provide confidence scores (0.0-1.0) based on clarity of match.
4. Suggest parameter values when obvious from context (e.g., "send email to John" -> to: "john@example.com").
5. Consider workflow context if provided (e.g., avoid suggesting already-used pieces unless user specifies).
6. Return STRICT JSON only, no markdown, no other text.

AVAILABLE PIECES AND ACTIONS:
`;

      const userQueryPart = `\n\n${contextPrefix}USER QUERY: "${normalizedQuery}"`;

      const basePromptTokens = estimateTokens(basePrompt);
      const userQueryTokens = estimateTokens(userQueryPart);
      const totalBaseTokens = basePromptTokens + userQueryTokens;
      const remainingTokens = MAX_PROMPT_TOKENS - totalBaseTokens;

      if (remainingTokens <= 0) {
        console.warn(`[AI Suggestion] Prompt too long (${totalBaseTokens} tokens) even without actions. Query may be too verbose.`);
        return res.json({ suggestions: [], tokensUsed: 0, processingTimeMs: Date.now() - startTime });
      }

      // Dynamically include actions based on remaining token budget
      const actionsToInclude: Array<{ pieceDisplay: string; pieceName: string; action: APAction }> = [];
      let tokensUsedForActions = 0;

      for (const actionItem of flattenedActions) {
        // Truncate description for prompt to save tokens
        const truncatedDesc = actionItem.action.description.substring(0, MAX_DESCRIPTION_LENGTH) +
          (actionItem.action.description.length > MAX_DESCRIPTION_LENGTH ? '...' : '');

        const actionStr = `PIECE: "${actionItem.pieceDisplay}" (id: "${actionItem.pieceName}")
ACTION: "${actionItem.action.displayName}" (id: "${actionItem.action.name}")
DESCRIPTION: ${truncatedDesc}
PARAMETERS: ${actionItem.action.required ? 'Required' : 'Optional'}`;

        const actionTokens = estimateTokens(actionStr) + 1; // +1 for newline separation

        if (tokensUsedForActions + actionTokens <= remainingTokens) {
          actionsToInclude.push(actionItem);
          tokensUsedForActions += actionTokens;
        } else {
          // If adding this action exceeds the limit, stop adding more to prevent prompt overflow.
          break;
        }
      }

      const piecesString = actionsToInclude.map(({ pieceDisplay, pieceName, action }) =>
        `PIECE: "${pieceDisplay}" (id: "${pieceName}")
ACTION: "${action.displayName}" (id: "${action.name}")
DESCRIPTION: ${action.description.substring(0, MAX_DESCRIPTION_LENGTH)}${action.description.length > MAX_DESCRIPTION_LENGTH ? '...' : ''}
PARAMETERS: ${action.required ? 'Required' : 'Optional'}`
      ).join('\n\n');

      const systemPrompt = basePrompt + piecesString + userQueryPart;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Using gpt-3.5-turbo as a cost-effective choice
        messages: [
          { role: 'system', content: 'You are a helpful assistant that returns only valid JSON arrays.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.2, // Lower temperature for more consistent, less creative suggestions
        max_tokens: 800, // Maximum tokens for the AI's response
        response_format: { type: "json_object" } // Enforce JSON output for GPT-4 Turbo and later models. For gpt-3.5-turbo, this acts as a strong hint.
      });

      const content = completion.choices[0].message.content?.trim();
      let suggestions: ActionSuggestion[] = [];

      if (content) {
        try {
          // Robust JSON parsing: handle potential markdown code blocks
          const jsonStr = content.replace(/^```json\n?|\n?```$/g, '').trim();
          const parsed = JSON.parse(jsonStr);

          if (Array.isArray(parsed)) {
            suggestions = parsed.filter((s: unknown): s is ActionSuggestion =>
              typeof s === 'object' && s !== null &&
              'pieceName' in s && typeof (s as ActionSuggestion).pieceName === 'string' &&
              'actionName' in s && typeof (s as ActionSuggestion).actionName === 'string' &&
              'confidence' in s && typeof (s as ActionSuggestion).confidence === 'number' &&
              (s as ActionSuggestion).confidence >= 0 && (s as ActionSuggestion).confidence <= 1
            ).map(s => {
              const suggestion = s as ActionSuggestion; // Cast after initial filter
              const isValid = actionIndex.has(suggestion.pieceName) &&
                              actionIndex.get(suggestion.pieceName)?.has(suggestion.actionName);

              // Only return valid, existing actions
              if (isValid) {
                return {
                  pieceName: suggestion.pieceName,
                  actionName: suggestion.actionName,
                  confidence: suggestion.confidence,
                  suggestedParameters: suggestion.suggestedParameters || {}, // Ensure it's an object
                  reasoning: suggestion.reasoning || ''
                };
              }
              return null; // Filter out invalid suggestions
            }).filter((s): s is ActionSuggestion => s !== null);
          }
        } catch (parseError: unknown) {
          console.error('[AI Suggestion] Failed to parse AI response:', parseError, 'Content:', content);
          // Log the raw content to aid debugging parsing failures
        }
      }

      const response: SuggestionResponse = {
        suggestions,
        tokensUsed: completion.usage?.total_tokens ?? 0,
        processingTimeMs: Date.now() - startTime
      };

      // Cache successful response if enabled
      if (enableCache) {
        suggestionCache.set(cacheKey, { suggestions, timestamp: Date.now() });
      }

      return res.json(response);

    } catch (error: unknown) {
      console.error('[AI Suggestion] OpenAI API error:', error);
      // Determine if it's an OpenAI API error with a message
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
          errorMessage = error.message;
      }
      return res.status(500).json({
        suggestions: [],
        tokensUsed: 0,
        processingTimeMs: Date.now() - startTime,
        error: errorMessage // Add error message to response for better debugging
      });
    }
  });

  // Register the router with the main app
  app.use(router);
}

// Exported types and constants must be placed at the end of the file, after all logic.

/** Represents a single action within an Activepieces piece. */
export interface APAction {
  name: string;
  displayName: string;
  description: string;
  required: boolean;
  schema?: Record<string, unknown>; // Changed from any to Record<string, unknown>
}

/** Represents an Activepieces piece, containing multiple actions. */
export interface APPiece {
  name: string;
  displayName: string;
  description: string;
  actions: APAction[];
  logoUrl?: string;
}

/** Represents a suggested action from the AI. */
export interface ActionSuggestion {
  pieceName: string;
  actionName: string;
  confidence: number;
  suggestedParameters: Record<string, unknown>; // Changed from any to Record<string, unknown>
  reasoning: string;
}

/** Request payload for the AI suggestion endpoint. */
export interface SuggestionRequest {
  query: string;
  workloadContext?: {
    existingPieces?: string[];
    stepIndex?: number;
  };
}

/** Response payload from the AI suggestion endpoint. */
export interface SuggestionResponse {
  suggestions: ActionSuggestion[];
  tokensUsed: number;
  processingTimeMs: number;
  error?: string; // Added for more robust error reporting
}