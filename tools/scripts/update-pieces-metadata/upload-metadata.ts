import assert from 'node:assert'
import {
    S3,
    PutObjectCommand,
    PutObjectCommandInput,
    ObjectCannedACL,
    HeadObjectCommand,
    HeadObjectCommandInput,
    NotFound
} from '@aws-sdk/client-s3'
import { PieceMetadata, PieceMetadataSummary } from '../../../packages/shared/src'

assert(process.env.DO_SPACES_KEY)
assert(process.env.DO_SPACES_SECRET)

const doSpacesClient = new S3({
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    region: 'us-east-1', // dummy region needed by S3 client
    endpoint: 'https://fra1.digitaloceanspaces.com',
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
})

const BUCKET_NAME = 'activepieces-cdn'

const uploadFile = async (fileName: string, data: string) => {
    console.log(`upload, fileName: ${fileName}`)

    const input: PutObjectCommandInput = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: data,
        ACL: ObjectCannedACL.public_read,
    }

    await doSpacesClient.send(new PutObjectCommand(input))
}

const fileExists = async (fileName: string): Promise<boolean> => {
    const input: HeadObjectCommandInput = {
        Bucket: BUCKET_NAME,
        Key: fileName,
    }

    try {
        await doSpacesClient.send(new HeadObjectCommand(input))
    }
    catch (e: unknown) {
        if (e instanceof NotFound) {
            return false
        }

        throw e
    }

    return true
}

/**
 * Uploads piece metadata.
 * Skips upload if metadata already exists, to prevent overriding old metadata which could break old flows.
 * @param pieceMetadata metadata to upload
 */
const uploadPieceMetadataIfNotExist = async (pieceMetadata: PieceMetadata) => {
    console.info(`uploadPieceMetadata, name: ${pieceMetadata.name}, version: ${pieceMetadata.version}`)

    const { name, version } = pieceMetadata
    const fileName = `pieces/metadata/${name}/${version}.json`

    if (await fileExists(fileName)) {
        console.info(`uploadPieceMetadata, file already exists`)
        return
    }

    const data = JSON.stringify(pieceMetadata)
    await uploadFile(fileName, data)
}

const uploadPiecesManifest = async (piecesMetadata: PieceMetadata[]) => {
    const piecesMetadataSummary: PieceMetadataSummary[] = piecesMetadata.map(p => ({
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        logoUrl: p.logoUrl,
        version: p.version,
        minimumSupportedRelease: p.minimumSupportedRelease,
        maximumSupportedRelease: p.maximumSupportedRelease,
        actions: Object.keys(p.actions).length,
        triggers: Object.keys(p.triggers).length,
    }))

    const fileName = `pieces/metadata/latest.json`
    const data = JSON.stringify(piecesMetadataSummary)
    await uploadFile(fileName, data)
}

export const uploadMetadata = async (piecesMetadata: PieceMetadata[]) => {
    for (const pieceMetadata of piecesMetadata) {
        await uploadPieceMetadataIfNotExist(pieceMetadata)
    }

    await uploadPiecesManifest(piecesMetadata)
}
