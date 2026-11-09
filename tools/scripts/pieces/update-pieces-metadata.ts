import assert from 'node:assert';
import { PieceMetadata } from '../../../packages/pieces/framework/src';
import { StatusCodes } from 'http-status-codes';
import { HttpHeader } from '../../../packages/pieces/common/src';
import { AP_CLOUD_API_BASE, findNewPieces, pieceMetadataExists } from '../utils/piece-script-utils';
import { npmTarball } from '../utils/npm-tarball';
import { chunk } from '@activepieces/core-utils';
assert(process.env['AP_CLOUD_API_KEY'], 'API Key is not defined');

const { AP_CLOUD_API_KEY } = process.env;

const insertPieceMetadata = async (
  pieceMetadata: PieceMetadata
): Promise<void> => {
  const body = JSON.stringify(pieceMetadata);

  const headers = {
    ['api-key']: AP_CLOUD_API_KEY,
    [HttpHeader.CONTENT_TYPE]: 'application/json'
  };

  const cloudResponse = await fetch(`${AP_CLOUD_API_BASE}/admin/pieces`, {
    method: 'POST',
    headers,
    body
  });

  if (cloudResponse.status !== StatusCodes.OK && cloudResponse.status !== StatusCodes.CONFLICT) {
    throw new Error(await cloudResponse.text());
  }
};



const insertMetadataIfNotExist = async (pieceMetadata: PieceMetadata): Promise<boolean> => {
  console.info(
    `insertMetadataIfNotExist, name: ${pieceMetadata.name}, version: ${pieceMetadata.version}`
  );

  const metadataAlreadyExist = await pieceMetadataExists(
    pieceMetadata.name,
    pieceMetadata.version
  );

  if (metadataAlreadyExist) {
    console.info(`insertMetadataIfNotExist, piece metadata already inserted`);
    return true;
  }

  if (!await npmTarball.waitUntilDownloadable(pieceMetadata)) {
    return false;
  }

  await insertPieceMetadata(pieceMetadata);
  return true;
};

const insertMetadata = async (piecesMetadata: PieceMetadata[]): Promise<PieceMetadata[]> => {
  const notDownloadable: PieceMetadata[] = []
  const batches = chunk(piecesMetadata, 30)
  for (const batch of batches) {
    const ready = await Promise.all(batch.map(insertMetadataIfNotExist))
    notDownloadable.push(...batch.filter((_, index) => !ready[index]))
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  return notDownloadable
};

const main = async () => {
  console.log('update pieces metadata: started')

  const { pieces, failures } = await findNewPieces()

  if (failures.length > 0) {
    console.error(`update pieces metadata: ${failures.length} piece(s) failed to load:`)
    for (const failure of failures) {
      console.error(`  - ${failure.path}: ${failure.error}`)
    }
  }

  const notDownloadable = await insertMetadata(pieces)

  if (notDownloadable.length > 0) {
    console.error(`update pieces metadata: ${notDownloadable.length} piece(s) skipped, npm tarball never became downloadable:`)
    for (const piece of notDownloadable) {
      console.error(`  - ${piece.name}@${piece.version}`)
    }
  }

  if (failures.length > 0 || notDownloadable.length > 0) {
    process.exit(1)
  }

  console.log('update pieces metadata: completed')
  process.exit()
}

main()
