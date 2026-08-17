const PIECE_HOST_ARG = '--piece-host'

const isPieceHost = process.argv.includes(PIECE_HOST_ARG)

export const pieceProcessConfig = {
    isPieceHost,
    shouldOffload: process.env.AP_REUSE_SANDBOX === 'true' && !isPieceHost,
    PIECE_HOST_ARG,
}
