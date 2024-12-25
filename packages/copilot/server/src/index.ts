import { generatePiecesEmbeddings } from './lib/tools/embeddings';
import dotenv from 'dotenv';
import { startWebSocketServer } from './lib/util/websocket';

dotenv.config();

async function boot(){
  await generatePiecesEmbeddings()
  startWebSocketServer()
}

boot()
