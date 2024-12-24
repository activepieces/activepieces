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

export const plannerAgent: Agent<FlowTrigger> = {
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
      `${piece.displayName} (${piece.name}): ${piece.description}\n` +
      `Available: ${piece.triggers} triggers, ${piece.actions} actions`
    ).join('\n\n');

    // Step 3: Generate flow plan using the actual piece data
    const { object } = await generateObject({
      model: openai('gpt-4'),
      schema: FlowTrigger,
      prompt: `
        You are a planner agent that creates a flow outline for a user. The goal is to create a flow outline that starts with a trigger and then has a simple or conditional action.
        
        Available pieces and their capabilities:
        ${piecesContext}

        User request: ${prompt}

        Create a flow that satisfies this request using only the available pieces listed above.
      `,
    });

    return object;
  },
};
