import { ExecutionMode } from '@activepieces/shared'

const PIECE_HOST_ARG = '--piece-host'

const isPieceHost = process.argv.includes(PIECE_HOST_ARG)

// Forking a piece-host child is only safe when the engine itself is a plain process,
// not running inside the isolate jail. These are the reused ("warm") non-isolate modes.
const NON_ISOLATE_MODES: string[] = [ExecutionMode.UNSANDBOXED, ExecutionMode.SANDBOX_CODE_ONLY]

const shouldOffload =
    process.env.AP_REUSE_SANDBOX === 'true'
    && NON_ISOLATE_MODES.includes(process.env.AP_EXECUTION_MODE ?? '')
    && !isPieceHost

export const pieceProcessConfig = {
    isPieceHost,
    shouldOffload,
    PIECE_HOST_ARG,
}
