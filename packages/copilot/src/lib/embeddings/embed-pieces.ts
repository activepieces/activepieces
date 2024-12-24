import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PieceSegment, EmbeddedPiece } from './types';
import fs from 'fs/promises';
import path from 'path';

export async function embedPieces(segments: PieceSegment[]): Promise<EmbeddedPiece[]> {
  console.debug('Generating embeddings for segments...');
  
  try {
    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: segments.map(segment => segment.content),
    });

    const embeddedPieces: EmbeddedPiece[] = segments.map((segment, index) => ({
      ...segment,
      embedding: embeddings[index],
    }));

    console.debug(`Successfully generated embeddings for ${embeddedPieces.length} segments`);
    return embeddedPieces;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

export async function saveEmbeddings(embeddedPieces: EmbeddedPiece[], outputPath: string): Promise<void> {
  console.debug(`Saving embeddings to ${outputPath}...`);
  
  try {
    const dirPath = path.dirname(outputPath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(embeddedPieces, null, 2));
    console.debug('Successfully saved embeddings');
  } catch (error) {
    console.error('Error saving embeddings:', error);
    throw error;
  }
}

export async function loadEmbeddings(inputPath: string): Promise<EmbeddedPiece[]> {
  console.debug(`Loading embeddings from ${inputPath}...`);
  
  try {
    const data = await fs.readFile(inputPath, 'utf-8');
    const embeddedPieces = JSON.parse(data) as EmbeddedPiece[];
    console.debug(`Successfully loaded ${embeddedPieces.length} embedded pieces`);
    return embeddedPieces;
  } catch (error) {
    console.error('Error loading embeddings:', error);
    throw error;
  }
} 