import { ActionBase, PieceMetadataModelSummary, TriggerBase } from '@activepieces/pieces-framework'
import { z } from 'zod'

import { agentToolsName, agentStateKeys, SuggestionType } from '@activepieces/shared'
import { engineApiService } from '../../api/server-api.service'

export function createFlowTools({ engineToken, projectId, platformId, state }: CreateFlowState) {
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
        [agentToolsName.WRITE_FLOWS_TOOL_NAME]: {
            description: `Create or update flows in the workspace. When merge=true, updates existing flows by id and adds new ones. When merge=false, replaces all existing flows with the provided list. Each flow requires a trigger, prompt describing its purpose, and a list of tools/actions it can use.`,
            inputSchema: writeFlowsInputSchema,
            async execute(input: z.infer<typeof writeFlowsInputSchema>) {
                const currentState = getState(state)
                if (input.merge) {
                    for (const flow of input.flows) {
                        const index = currentState.flows.findIndex(f => f.id === flow.id)
                        if (index !== -1) {
                            currentState.flows[index] = flow
                        } else {
                            currentState.flows.push(flow)
                        }
                    }
                } else {
                    currentState.flows = input.flows
                }
                state[agentStateKeys.FLOWS] = currentState
                return currentState
            },
        },
    }
}

type CreateFlowState = {
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
    id: z.string().describe('Unique identifier for the flow (used for updates when merge=true)'),
    displayName: z.string().describe('Human-readable name shown in the UI'),
    description: z.string().describe('Detailed description of what this flow automates'),
    trigger: triggerSchema.describe('The trigger that starts this flow'),
    prompt: z.string().describe('Instructions describing the flow purpose and how tools should be used'),
    tools: z.array(toolSchema).describe('List of actions/tools available for this flow to execute'),
})

const writeFlowsInputSchema = z.object({
    flows: z.array(simpleFlowSchema).describe('Array of flows to create or update'),
    merge: z.boolean().describe('When true, merges with existing flows by id. When false, replaces all existing flows'),
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

// System prompt for flow creation tools
export const FLOW_TOOLS_SYSTEM_PROMPT = `## Flow Creation Tools

You have access to flow creation tools to help users build automation workflows.

### Available Tools

1. **\`${agentToolsName.SEARCH_TRIGGERS_TOOL_NAME}\`** - Find triggers that can start a flow
   - Use when user wants to automate based on events (new email, webhook, schedule, etc.)
   - Only supports simple app name (integration) search, not semantic or fuzzy search

2. **\`${agentToolsName.SEARCH_TOOLS_TOOL_NAME}\`** - Find actions/tools to add to flows
   - Use when user needs specific capabilities (send email, create record, AI processing)
   - Only supports searching by app/integration name, not by generic action or semantic query

3. **\`${agentToolsName.LIST_FLOWS_TOOL_NAME}\`** - View existing flows
   - Use before creating new flows to avoid duplicates
   - Use to understand current automation setup

4. **\`${agentToolsName.WRITE_FLOWS_TOOL_NAME}\`** - Create or update flows
   - Use merge=true to update specific flows while keeping others
   - Use merge=false to replace all flows with a new configuration

### Workflow for Creating Flows

1. **Understand the requirement** - What does the user want to automate?
2. **Search for triggers** - Use an app/integration name to find a trigger to start the flow
3. **Search for tools** - Use an app/integration name to find available actions needed for the automation
4. **List existing flows** - Check if similar automation already exists
5. **Write the flow** - Create the flow with appropriate trigger, prompt, and tools

### Best Practices

- Always search for available apps (integration names) to find triggers/tools before writing flows. Do NOT rely on generic or semantic search for tool/trigger names.
- Use descriptive names and detailed descriptions for flows
- Write clear prompts that explain the flow's purpose
- Include only necessary tools to keep flows focused
- Use merge=true when updating a single flow to preserve others`


const getState = (state: CreateFlowState['state']) => {
    return state[agentStateKeys.FLOWS] as z.infer<typeof listFlowsOutputSchema>
}