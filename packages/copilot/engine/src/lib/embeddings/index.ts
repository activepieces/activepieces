import { fetchPieces } from './fetch-pieces';
import { processPieces } from './process-pieces';
import { embedPieces, saveEmbeddings, loadEmbeddings } from './embed-pieces';
import path from 'path';
import { EmbeddedPiece } from './types';
import { cosineSimilarity, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';


const EMBEDDINGS_DIR = path.join(__dirname, '..', '..', '..', '..', 'data');
const EMBEDDINGS_PATH = path.join(EMBEDDINGS_DIR, 'pieces-embeddings.json');

export async function generatePiecesEmbeddings(): Promise<void> {
  try {
    console.debug('Starting pieces embedding generation process...');
    

    const pieces = await fetchPieces();
    console.debug(`Fetched ${pieces.length} pieces`);
    

    const segments = processPieces(pieces);
    console.debug(`Created ${segments.length} segments`);

    const embeddedPieces = await embedPieces(segments);
    await saveEmbeddings(embeddedPieces, EMBEDDINGS_PATH);
    
    console.debug('Pieces embedding generation completed successfully');
  } catch (error) {
    console.error('Error in pieces embedding generation:', error);
    throw error;
  }
}

export async function findRelevantPieces(query: string, threshold: number = 0.35): Promise<EmbeddedPiece[]> {
  try {
    const embeddedPieces = await loadEmbeddings(EMBEDDINGS_PATH);
    console.debug(`Loaded ${embeddedPieces.length} embedded pieces`);
    

    const { embeddings: [queryEmbedding] } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: [query],
    });
    
    const piecesWithScores = embeddedPieces.map(piece => ({
      piece,
      similarity: cosineSimilarity(queryEmbedding, piece.embedding)
    }));

 
    piecesWithScores.sort((a, b) => b.similarity - a.similarity);

    console.debug('Top 5 matches:');
    piecesWithScores.slice(0, 5).forEach(({ piece, similarity }) => {
      console.debug(`- ${piece.metadata.pieceName} (${similarity.toFixed(3)}): ${piece.content}`);
    });

    const seenPieceNames = new Set<string>();
    const relevantPieces = piecesWithScores
      .filter(({ similarity }) => similarity >= threshold)
      .reduce<EmbeddedPiece[]>((acc, { piece }) => {
        if (!seenPieceNames.has(piece.metadata.pieceName)) {
          seenPieceNames.add(piece.metadata.pieceName);
          acc.push(piece);
        }
        return acc;
      }, []);
    
    console.debug(`Found ${relevantPieces.length} unique relevant pieces above threshold ${threshold}`);
    console.debug('Relevant pieces:', relevantPieces.map(p => p.metadata.pieceName));
    return relevantPieces;
  } catch (error) {
    console.error('Error finding relevant pieces:', error);
    throw error;
  }
}


export { EmbeddedPiece, loadEmbeddings, EMBEDDINGS_PATH }; 