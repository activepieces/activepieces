import { ActionBase, PieceMetadataModelSummary, TriggerBase } from '@activepieces/pieces-framework'
import { z } from 'zod'
import { agentToolsName, agentStateKeys, SuggestionType } from '@activepieces/shared'
import { engineApiService } from '../../../../api/server-api.service'
import * as fs from 'fs'
import * as path from 'path'

// Read SKILL.md at module load time
const SKILL_MD_PATH = path.join(__dirname, 'SKILL.md')
export const FLOW_MAKER_SKILL = fs.readFileSync(SKILL_MD_PATH, 'utf-8')

export function createFlowMakerTools({ engineToken, projectId, platformId, state }: CreateFlowMakerState) {
    const apiService = engineApiService(engineToken)
    
    return {
        [agentToolsName.SEARCH_TRIGGERS_TOOL_NAME]: {
            description: `Search for triggers by app name. This is NOT a semantic search: only app/integration (piece) names are matched. Use this to find triggers that can start a flow in a specific app (for example, "gmail" for new email, "slack" for new message, or "webhook" for generic webhooks). Returns matches with app name, trigger name, and description.`,
            inputSchema: searchTriggersInputSchema,
            outputSchema: searchTriggersOutputSchema,
            async execute(input: z.infer<typeof searchTriggersInputSchema>) {
                const pieces = await apiService.listPieces({
                    searchQuery: input.query,
                    suggestionType: SuggestionType.TRIGGER,
                })
                
                const triggers = pieces.flatMap((piece: PieceMetadataModelSummary) => 
                    (piece.suggestedTriggers ?? []).map((trigger: TriggerBase) => ({
                        pieceName: piece.name,
                        triggerName: trigger.name,
                        description: trigger.description,
                    }))
                )
                
                return { triggers }
            },
        },
        [agentToolsName.SEARCH_TOOLS_TOOL_NAME]: {
            description: `Search for actions/tools by app name. This is NOT a semantic search: only the app/integration (piece) name is matched. Use this to find actions provided by a specific app (for example, "gmail" for sending email, "notion" for create page, or "openai" for AI actions). Returns matches with app name, action name, and description.`,
            inputSchema: searchToolsInputSchema,
            outputSchema: searchToolsOutputSchema,
            async execute(input: z.infer<typeof searchToolsInputSchema>) {
                const pieces = await apiService.listPieces({
                    searchQuery: input.query,
                    suggestionType: SuggestionType.ACTION,
                })
                
                const tools = pieces.flatMap((piece: PieceMetadataModelSummary) => 
                    (piece.suggestedActions ?? []).map((action: ActionBase) => ({
                        pieceName: piece.name,
                        toolName: action.name,
                        description: action.description,
                    }))
                )
                
                return { tools }
            },
        },
        [agentToolsName.LIST_FLOWS_TOOL_NAME]: {
            description: `List all existing flows in the current workspace. Returns flow details including id, display name, description, trigger configuration, prompt, and associated tools. Use this to understand what automations already exist before creating or modifying flows.`,
            inputSchema: listFlowsInputSchema,
            outputSchema: listFlowsOutputSchema,
            async execute(_input: z.infer<typeof listFlowsInputSchema>) {
                const currentState = getState(state)
                return currentState
            },
        },
        [agentToolsName.SUGGEST_FLOW_TOOL_NAME]: {
            description: `Suggest a flow to the user. The flow will NOT be added automatically - it will be presented to the user for review. If the user accepts the suggestion, it will be added to their flows. Each flow requires a trigger, prompt describing its purpose, and a list of tools/actions it can use.`,
            inputSchema: suggestFlowInputSchema,
            outputSchema: suggestFlowOutputSchema,
            async execute(input: z.infer<typeof suggestFlowInputSchema>) {
                return {
                    suggestion: input.flow,
                    message: 'Flow suggestion created. Waiting for user approval.',
                }
            },
        },
    }
}

type CreateFlowMakerState = {
    engineToken: string
    projectId: string
    platformId: string
    state: Record<string, unknown>
}

// Schema definitions
const triggerSchema = z.object({
    pieceName: z.string().describe('Name of the app/integration providing the trigger (e.g., "gmail", "slack", "webhook")'),
    triggerName: z.string().describe('Specific trigger name within the app (e.g., "new_email", "new_message")'),
    description: z.string().optional().describe('Human-readable description of what this trigger does'),
})

const toolSchema = z.object({
    pieceName: z.string().describe('Name of the app/integration providing the action (e.g., "gmail", "slack", "openai")'),
    actionName: z.string().describe('Specific action name within the app (e.g., "send_email", "post_message")'),
    description: z.string().optional().describe('Human-readable description of what this action does'),
})

const simpleFlowSchema = z.object({
    id: z.string().describe('Unique identifier for the flow'),
    displayName: z.string().describe('Human-readable name shown in the UI'),
    description: z.string().describe('Detailed description of what this flow automates'),
    trigger: triggerSchema.describe('The trigger that starts this flow'),
    prompt: z.string().describe('Instructions describing the flow purpose and how tools should be used'),
    tools: z.array(toolSchema).describe('List of actions/tools available for this flow to execute'),
})

const suggestFlowInputSchema = z.object({
    flow: simpleFlowSchema.describe('The flow to suggest to the user'),
})

const suggestFlowOutputSchema = z.object({
    suggestion: simpleFlowSchema.describe('The suggested flow awaiting user approval'),
    status: z.union([z.literal('accepted'), z.literal('pending')])
})

const listFlowsInputSchema = z.object({})

const listFlowsOutputSchema = z.object({
    flows: z.array(simpleFlowSchema).describe('Array of all existing flows in the workspace'),
})

const searchTriggersInputSchema = z.object({
    query: z.string().min(1, 'Search query cannot be empty').describe('App/integration (piece) name to search for triggers (for example: "gmail", "slack", "webhook")'),
})

const searchTriggersOutputSchema = z.object({
    triggers: z.array(triggerSchema).describe('List of triggers matching the app name search query'),
})

const searchToolsInputSchema = z.object({
    query: z.string().min(1, 'Search query cannot be empty').describe('App/integration (piece) name to search for actions/tools (for example: "gmail", "notion", "openai")'),
})

const searchToolsOutputSchema = z.object({
    tools: z.array(z.object({
        pieceName: z.string().describe('Name of the app/integration providing the action'),
        toolName: z.string().describe('Specific action/tool name within the app'),
        description: z.string().optional().describe('Human-readable description of what this tool does'),
    })).describe('List of tools/actions matching the app name search query'),
})

const getState = (state: CreateFlowMakerState['state']): z.infer<typeof listFlowsOutputSchema> => {
    const currentState = state[agentStateKeys.FLOWS] as z.infer<typeof listFlowsOutputSchema> | undefined
    if (!currentState) {
        return { flows: [] }
    }
    return currentState
}
