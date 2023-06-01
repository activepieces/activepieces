import assert from 'node:assert'
import { PieceMetadata } from '../../../packages/pieces/framework/src'
import { StatusCodes } from 'http-status-codes'
import { HttpHeader } from '../../../packages/pieces/common/src'

assert(process.env.AP_CLOUD_API_KEY)

const AP_CLOUD_API_URL = 'https://cloud.activepieces.com/v1/pieces'

const insertPieceMetadata = async (pieceMetadata: PieceMetadata): Promise<void> => {
    const body = JSON.stringify(pieceMetadata)

    const headers = {
        [HttpHeader.CONTENT_TYPE]: 'application/json',
    }

    const cloudResponse = await fetch(AP_CLOUD_API_URL, {
        method: 'post',
        headers,
        body,
    })

    if (cloudResponse.status !== StatusCodes.OK) {
        throw new Error(await cloudResponse.text())
    }
}

const pieceMetadataExists = async (pieceName: string, pieceVersion: string): Promise<boolean> => {
    const cloudResponse = await fetch(`${AP_CLOUD_API_URL}/${pieceName}?version=${pieceVersion}`)

    return cloudResponse.status === StatusCodes.OK
}

const insertMetadataIfNotExist = async (pieceMetadata: PieceMetadata) => {
    console.info(`insertMetadataIfNotExist, name: ${pieceMetadata.name}, version: ${pieceMetadata.version}`)

    const metadataAlreadyExist = await pieceMetadataExists(pieceMetadata.name, pieceMetadata.version)
    if (metadataAlreadyExist) {
        console.info(`insertMetadataIfNotExist, piece metadata already inserted`)
        return
    }

    await insertPieceMetadata(pieceMetadata)
}

export const insertMetadata = async (piecesMetadata: PieceMetadata[]) => {
    for (const pieceMetadata of piecesMetadata) {
        await insertMetadataIfNotExist(pieceMetadata)
    }
}
