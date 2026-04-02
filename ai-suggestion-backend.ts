import express, { Request, Response } from 'express';
import OpenAI from 'openai';

export interface APAction {
  name: string;
  displayName: string;
  description: string;
  required: boolean;
  schema?: any;
}

export interface APPiece {
  name: string;
  displayName: string;
  description: string;
  actions: APAction[];
  logoUrl?: string;
}

export interface ActionSuggestion {
  pieceName: string;
  actionName: string;
  confidence: number;
  suggestedParameters: Record<string, any>;
  reasoning: string;
}

export interface SuggestionRequest {
  query: string;
  workloadContext?: {
    existingPieces?: string[];
    stepIndex?: number;
  };
}

export interface SuggestionResponse {
  suggestions: ActionSuggestion[];
  tokensUsed: number;
  processingTimeMs: number;
}

const suggestionCache = new Map<string, { suggestions: ActionSuggestion[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_PROMPT_TOKENS = 3500;
const MAX_DESCRIPTION_LENGTH = 100;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4) + text.split(/\s+/).filter(Boolean).length;
}

export function setupAISuggestionEndpoint(
  app: express.Express,
  pieces: APPiece[],
  openAIApiKey: string,
  enableCache: boolean = true
) {
  const openai = new OpenAI({ apiKey: openAIApiKey });
  const router = express.Router();

  const actionIndex = new Map<string, Map<string, APAction>>();
  pieces.forEach(piece => {
    const actionsMap = new Map<string, APAction>();
    piece.actions.forEach(action => {
      actionsMap.set(action.name, action);
    });
    actionIndex.set(piece.name, actionsMap);
  });

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

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ suggestions: [], tokensUsed: 0, processingTimeMs: Date.now() - startTime });
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `${normalizedQuery}-${JSON.stringify(workloadContext || {})}`;

    if (enableCache) {
      const cached = suggestionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        return res.json({
          suggestions: cached.suggestions,
          tokensUsed: 0,
          processingTimeMs: Date.now() - startTime
        });
      }
    }

    try {
      const contextPrefix = workloadContext?.existingPieces?.length
        ? `Current workflow already uses: ${workloadContext.existingPieces.join(', ')}. `
        : '';

      const basePrompt = `You are an AI assistant for Activepieces, a workflow automation tool. Given a user's natural language description, suggest relevant actions from the available pieces.

RULES:
1. Only suggest actions that EXACTLY match the available pieces and actions listed below
2. If no action matches, return empty array
3. Provide confidence scores (0.0-1.0) based on clarity of match
4. Suggest parameter values when obvious from context (e.g., "send email to John" -> to: "john@example.com")
5. Consider workflow context if provided (avoid suggesting already-used pieces unless user specifies)
6. Return STRICT JSON only, no markdown

AVAILABLE PIECES AND ACTIONS:
`;

      const userQueryPart = `\n\n${contextPrefix}USER QUERY: "${normalizedQuery}"`;

      const basePromptTokens = estimateTokens(basePrompt);
      const userQueryTokens = estimateTokens(userQueryPart);
      const totalBaseTokens = basePromptTokens + userQueryTokens;
      const remainingTokens = MAX_PROMPT_TOKENS - totalBaseTokens;

      if (remainingTokens <= 0) {
        console.warn(`Prompt too long (${totalBaseTokens} tokens) even without actions. Query may be too verbose.`);
        return res.json({ suggestions: [], tokensUsed: 0, processingTimeMs: Date.now() - startTime });
      }

      const actionsToInclude: Array<{ pieceDisplay: string; pieceName: string; action: APAction }> = [];
      let tokensUsedForActions = 0;

      for (const actionItem of flattenedActions) {
        const truncatedDesc = actionItem.action.description.substring(0, MAX_DESCRIPTION_LENGTH) + 
          (actionItem.action.description.length > MAX_DESCRIPTION_LENGTH ? '...' : '');
        
        const actionStr = `PIECE: "${actionItem.pieceDisplay}" (id: "${actionItem.pieceName}")
ACTION: "${actionItem.action.displayName}" (id: "${actionItem.action.name}")
DESCRIPTION: ${truncatedDesc}
PARAMETERS: ${actionItem.action.required ? 'Required' : 'Optional'}`;

        const actionTokens = estimateTokens(actionStr) + 1;

        if (tokensUsedForActions + actionTokens <= remainingTokens) {
          actionsToInclude.push(actionItem);
          tokensUsedForActions += actionTokens;
        } else {
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that returns only valid JSON arrays.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.2,
        max_tokens: 800,
      });

      const content = completion.choices[0].message.content?.trim();
      let suggestions: ActionSuggestion[] = [];

      if (content) {
        try {
          const jsonStr = content.replace(/^```json\n?|\n?```$/g, '').trim();
          const parsed = JSON.parse(jsonStr);
          
          if (Array.isArray(parsed)) {
            suggestions = parsed.filter((s): s is ActionSuggestion => 
              typeof s === 'object' &&
              s.pieceName &&
              s.actionName &&
              typeof s.confidence === 'number' &&
              s.confidence >= 0 && s.confidence <= 1
            ).map(s => ({
              ...s,
              isValid: actionIndex.has(s.pieceName) && 
                       actionIndex.get(s.pieceName)?.has(s.actionName)
            })).filter(s => s.isValid).map(({isValid, ...s}) => ({
              pieceName: s.pieceName,
              actionName: s.actionName,
              confidence: s.confidence,
              suggestedParameters: s.suggestedParameters || {},
              reasoning: s.reasoning || ''
            }));
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError, content);
        }
      }

      const response: SuggestionResponse = {
        suggestions,
        tokensUsed: completion.usage?.total_tokens ?? 0,
        processingTimeMs: Date.now() - startTime
      };

      if (enableCache) {
        suggestionCache.set(cacheKey, { suggestions, timestamp: Date.now() });
      }

      return res.json(response);

    } catch (error) {
      console.error('OpenAI API error:', error);
      return res.status(500).json({ 
        suggestions: [], 
        tokensUsed: 0, 
        processingTimeMs: Date.now() - startTime 
      });
    }
  });

  app.use(router);
}
// === END ===