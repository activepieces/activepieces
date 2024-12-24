import { Flow, FlowType } from '../types/flow-outline';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findRelevantPieces } from '../embeddings';
import axios from 'axios';

interface PieceMetadata {
  name: string;
  displayName: string;
  description: string;
  actions: number;
  triggers: number;
  version: string;
  triggers_metadata?: Record<string, any>;
  actions_metadata?: Record<string, any>;
}

async function fetchPieceMetadata(pieceName: string): Promise<PieceMetadata | null> {
  try {
    const response = await axios.get(`https://cloud.activepieces.com/api/v1/pieces/${pieceName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching metadata for piece ${pieceName}:`, error);
    return null;
  }
}

interface PlannerAgent {
  plan(prompt: string): Promise<FlowType>;
}

export const plannerAgent: PlannerAgent = {
  async plan(prompt: string): Promise<FlowType> {
    console.debug('Starting flow planning process...');

    // Step 1: We want to find the relevant pieces that are most likely to be used to fulfill the request
    // We will use embeddings to find the most relevant pieces , we can use another way , but this way has no dependency on vector db
    const relevantPieces = await findRelevantPieces(prompt);
    console.debug('Found relevant pieces:', relevantPieces.map(p => p.metadata.pieceName));

    // Step 2: Now we will use activepieces api to get the metadata for each piece ,
    // TODO: I prefer to embed the pieces with their info in one shot 
    const uniquePieceNames = [...new Set(relevantPieces.map(p => p.metadata.pieceName))];
    const piecesMetadata = await Promise.all(
      uniquePieceNames.map(name => fetchPieceMetadata(name))
    );

    // Now here we are creating the context
    const validPieces = piecesMetadata.filter((p): p is PieceMetadata => p !== null);
    const piecesContext = validPieces.map(piece => 
      `${piece.displayName} (${piece.name}):\n` +
      `Description: ${piece.description}\n` +
      `Available: ${piece.triggers} triggers, ${piece.actions} actions\n` +
      `Triggers: ${piece.triggers_metadata ? Object.keys(piece.triggers_metadata).join(', ') : 'None'}\n` +
      `Actions: ${piece.actions_metadata ? Object.keys(piece.actions_metadata).join(', ') : 'None'}`
    ).join('\n\n');

    // Step 3: Generating ... 
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: Flow,
      prompt: `
        You are a planner agent that creates automation flows. Each flow consists of steps that execute in sequence.
        
        The flow should follow this pattern:
        1. First step must be a trigger (type: PIECE_TRIGGER) that starts the flow
        2. Following steps are actions (type: PIECE) that respond to the trigger
        3. If conditional logic is needed, use a ROUTER step with children array

        When designing the flow:
        1. First try to use piece triggers and actions directly if they can handle the requirements
        2. If you need conditional logic that pieces can't handle natively, use a ROUTER step:
           - Add a step with type: "ROUTER"
           - Include children array with conditions and actions
           - Each condition should reference trigger data (e.g., "{{trigger.row.field}} === 'value'")

        Available pieces and their capabilities:
        ${piecesContext}

        User request: ${prompt}

        Create a flow that satisfies this request using only the available pieces listed above.
        The flow should have:
        - A descriptive name that summarizes what it does (e.g., "On New Row Google Sheets Send Slack Message")
        - A clear description of its purpose
        - An array of steps that execute in sequence
        - Steps with clear, readable names (e.g., "New Row Added", "Send Message To Channel")
        - Basic input parameters where needed (you can use placeholders like {{connection['service-name']}})

        IMPORTANT: 
        - First try to fulfill the request using just piece triggers and actions
        - Only use a ROUTER if the logic cannot be handled by piece capabilities
        - Keep the flow as simple as possible while meeting the requirements
        - Give each step a clear, descriptive name that explains what it does
        - Put all input parameters in the step's input object, not as separate properties
      `,
    });

    return object;
  },
};
