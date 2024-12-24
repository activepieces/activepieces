import { FlowTrigger } from '../types/flow-outline';
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

export const plannerAgent = {
  async plan(prompt: string) {
    console.debug('Starting flow planning process...');

    // Step 1: Find relevant pieces using embeddings
    const relevantPieces = await findRelevantPieces(prompt);
    console.debug('Found relevant pieces:', relevantPieces.map(p => p.metadata.pieceName));

    // Step 2: Fetch detailed metadata for each unique piece
    const uniquePieceNames = [...new Set(relevantPieces.map(p => p.metadata.pieceName))];
    const piecesMetadata = await Promise.all(
      uniquePieceNames.map(name => fetchPieceMetadata(name))
    );

    // Filter out null results and create context
    const validPieces = piecesMetadata.filter((p): p is PieceMetadata => p !== null);
    const piecesContext = validPieces.map(piece => 
      `${piece.displayName} (${piece.name}):\n` +
      `Description: ${piece.description}\n` +
      `Available: ${piece.triggers} triggers, ${piece.actions} actions\n` +
      `Triggers: ${piece.triggers_metadata ? Object.keys(piece.triggers_metadata).join(', ') : 'None'}\n` +
      `Actions: ${piece.actions_metadata ? Object.keys(piece.actions_metadata).join(', ') : 'None'}`
    ).join('\n\n');

    // Step 3: Generate flow plan using the actual piece data
    const { object } = await generateObject({
      model: openai('gpt-4'),
      schema: FlowTrigger,
      prompt: `
        You are a planner agent that creates simple automation flows. Each flow consists of a trigger and a single action.
        The flow should follow this pattern:
        1. A trigger from one piece that starts the flow
        2. An action from another piece that responds to the trigger
        
        Available pieces and their capabilities:
        ${piecesContext}

        User request: ${prompt}

        Create a simple flow that satisfies this request using only the available pieces listed above.
        The flow should have:
        - A clear description of what it does
        - A trigger piece with its name and trigger type
        - An action piece with its name and action type
        - Basic input parameters where needed (you can use placeholders like {{connection['service-name']}})

        Keep it simple and focused on the core functionality requested.
      `,
    });

    return object;
  },
};
