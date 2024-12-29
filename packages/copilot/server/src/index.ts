import dotenv from 'dotenv';
import { startWebSocketServer } from './lib/util/websocket';
import { generatePiecesEmbeddings } from './lib/tools/embeddings/index';
import { initializeTestRegistry } from './lib/evaluation/test-registry'

dotenv.config();

initializeTestRegistry()

async function boot(){
  await generatePiecesEmbeddings()
  startWebSocketServer()
}

boot()

