import { fetchPieces } from './fetch-pieces';
import { processPieces } from './process-pieces';
import { embedPieces, saveEmbeddings, loadEmbeddings } from './embed-pieces';
import path from 'path';
import { EmbeddedPiece } from './types';
import { cosineSimilarity, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

const EMBEDDINGS_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'data'
);
const EMBEDDINGS_PATH = path.join(EMBEDDINGS_DIR, 'pieces-embeddings.json');

export async function embeddingsExist(): Promise<boolean> {
  try {
    return fs.existsSync(EMBEDDINGS_PATH);
  } catch (error) {
    console.error('Error checking embeddings existence:', error);
    return false;
  }
}

export async function generatePiecesEmbeddings(): Promise<void> {
  try {
    console.debug('Checking for existing embeddings...');
    if (await embeddingsExist()) {
      console.debug('Embeddings already exist, skipping generation');
      return;
    }

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

export async function findRelevantPieces(
  query: string,
  threshold: number = 0.35
): Promise<EmbeddedPiece[]> {
  try {
    const embeddedPieces = await loadEmbeddings(EMBEDDINGS_PATH);
    console.debug(`Loaded ${embeddedPieces.length} embedded pieces`);

    const {
      embeddings: [queryEmbedding],
    } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: [query],
    });

    // Calculate similarities and filter by threshold first
    const piecesWithScores = embeddedPieces
      .map((piece) => ({
        piece,
        similarity: cosineSimilarity(queryEmbedding, piece.embedding),
      }))
      .filter(({ similarity }) => similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    // Then deduplicate and create final pieces
    const seenPieceNames = new Set<string>();
    const relevantPieces = piecesWithScores.reduce<EmbeddedPiece[]>((acc, { piece, similarity }) => {
      if (!seenPieceNames.has(piece.metadata.pieceName)) {
        seenPieceNames.add(piece.metadata.pieceName);
        acc.push({
          ...piece,
          similarity,
        });
      }
      return acc;
    }, []);

    console.log(`Found ${relevantPieces.length} relevant pieces with threshold ${threshold}`);
    return relevantPieces;
  } catch (error) {
    console.error('Error finding relevant pieces:', error);
    throw error;
  }
}

export { EmbeddedPiece, loadEmbeddings, EMBEDDINGS_PATH };
