import { fetchPieces } from './fetch-pieces';
import { processPieces } from './process-pieces';
import { embedPieces, saveEmbeddings } from './embed-pieces';
import path from 'path';

const EMBEDDINGS_PATH = path.join(process.cwd(), 'data', 'pieces-embeddings.json');

export async function generatePiecesEmbeddings(): Promise<void> {
  try {
    console.debug('Starting pieces embedding generation process...');
    
    // Fetch pieces data
    const pieces = await fetchPieces();
    
    // Process pieces into segments
    const segments = processPieces(pieces);
    
    // Generate embeddings
    const embeddedPieces = await embedPieces(segments);
    
    // Save embeddings
    await saveEmbeddings(embeddedPieces, EMBEDDINGS_PATH);
    
    console.debug('Pieces embedding generation completed successfully');
  } catch (error) {
    console.error('Error in pieces embedding generation:', error);
    throw error;
  }
} 