import dotenv from 'dotenv';
import { startWebSocketServer } from './lib/util/websocket';
import { generatePiecesEmbeddings } from './lib/tools/embeddings/index';

dotenv.config();

async function boot(){
  await generatePiecesEmbeddings()
  startWebSocketServer()
}

boot()

