import { S3 } from '@aws-sdk/client-s3'
import assert from 'assert'
import { insertMetadata } from '../update-pieces-metadata/insert-metadata'
import { PieceMetadata } from '../../../packages/pieces/framework/src'

const listObjects = async (): Promise<string[]> => {
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

    const data = await doSpacesClient.listObjects({
        Bucket: 'activepieces-cdn',
        Prefix: 'pieces/metadata/'
    });

    assert(data.Contents)

    const objects = data.Contents
        .flatMap(o => (o.Key ? [o.Key] : []))
        .filter(k => !k.endsWith('latest.json'))

    console.log('listObjects, objects.length:', objects.length)

    return objects
}

const downloadMetadata = async (objects: string[]): Promise<PieceMetadata[]> => {
    const metadata: PieceMetadata[] = []

    for (const object of objects) {
        console.log('downloadMetadata, object:', object)

        const response = await fetch(`https://activepieces-cdn.fra1.digitaloceanspaces.com/${object}`)

        if (response.status !== 200) {
            throw new Error(await response.text())
        }

        const pieceMetadata = await response.json() as PieceMetadata

        pieceMetadata.minimumSupportedRelease = pieceMetadata.minimumSupportedRelease ?? '0.0.0'
        pieceMetadata.maximumSupportedRelease = pieceMetadata.maximumSupportedRelease ?? '99999.99999.99999'

        metadata.push(pieceMetadata)
    }

    const filteredMetadata = metadata
        .filter(p => p.version.match(/^[0-9]+\.[0-9]+\.[0-9]+$/))
        .filter(p => p.name.match(/^[A-Za-z0-9_\\-]+$/))

    console.log('downloadMetadata, filteredMetadata.length:', filteredMetadata.length)

    return filteredMetadata
}

const main = async () => {
    const objects = await listObjects()
    const pieceMetadata = await downloadMetadata(objects)
    await insertMetadata(pieceMetadata)
    process.exit()
}

main()
