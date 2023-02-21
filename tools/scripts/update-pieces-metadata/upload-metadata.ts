import assert from 'node:assert';
import { S3, PutObjectCommand, PutObjectCommandInput, ObjectCannedACL } from '@aws-sdk/client-s3';

assert(process.env.DO_SPACES_KEY)
assert(process.env.DO_SPACES_SECRET)

const doSpacesClient = new S3({
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    endpoint: 'https://fra1.digitaloceanspaces.com',
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
})

export const uploadMetadata = async (piecesMetadata: unknown[]) => {
    console.log('uploadMetadata')

    const bucketParams: PutObjectCommandInput = {
        Bucket: 'activepieces-cdn',
        Key: 'pieces/metadata/latest.json',
        Body: JSON.stringify(piecesMetadata),
        ACL: ObjectCannedACL.public_read,
    }

    await doSpacesClient.send(new PutObjectCommand(bucketParams))
}
