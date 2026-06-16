// Cloud Functions gen2 entry point for the engine.
//
// gen2 builds from source with buildpacks and runs functions-framework, which provides the HTTP
// server and calls the exported `engine` function. We reuse the exact same request handler as the
// standalone engine server (GET /health, POST /execute + Bearer), so a gen2 function speaks the
// identical contract the CLOUD_FUNCTION runtime expects.
import { engineServer } from '../../../../packages/server/engine/src/lib/engine-server'

export const engine = engineServer.createRequestListener()
