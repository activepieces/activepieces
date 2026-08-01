import assert from 'node:assert';
import * as semver from 'semver';
import { PieceMetadata } from '../../../packages/pieces/framework/src';
import { StatusCodes } from 'http-status-codes';
import { HttpHeader } from '../../../packages/pieces/common/src';
import { AP_CLOUD_API_BASE, findNewPieces, pieceMetadataExists } from '../utils/piece-script-utils';
import { readPackageJson } from '../utils/files';
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
    throw new Error(`status=${cloudResponse.status}, body=${await cloudResponse.text()}`);
  }
};

const isServableOnCurrentRelease = ({ pieceMetadata, currentRelease }: { pieceMetadata: PieceMetadata, currentRelease: string }): boolean => {
  const minimumSupportedRelease = pieceMetadata.minimumSupportedRelease

  if (!minimumSupportedRelease || !semver.valid(minimumSupportedRelease)) {
    return true
  }

  return !semver.gt(minimumSupportedRelease, currentRelease)
};



const insertMetadataIfNotExist = async (pieceMetadata: PieceMetadata) => {
  console.info(
    `insertMetadataIfNotExist, name: ${pieceMetadata.name}, version: ${pieceMetadata.version}`
  );

  const metadataAlreadyExist = await pieceMetadataExists(
    pieceMetadata.name,
    pieceMetadata.version
  );

  if (metadataAlreadyExist) {
    console.info(`insertMetadataIfNotExist, piece metadata already inserted`);
    return;
  }

  await insertPieceMetadata(pieceMetadata);
};

const insertMetadata = async (piecesMetadata: PieceMetadata[]) => {
  const batches = chunk(piecesMetadata, 30)
  const failures: string[] = []

  for (const batch of batches) {
    const results = await Promise.allSettled(batch.map(insertMetadataIfNotExist))
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failures.push(`  ${batch[index].name}@${batch[index].version}: ${result.reason}`)
      }
    })
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  if (failures.length > 0) {
    throw new Error(`[insertMetadata] ${failures.length} of ${piecesMetadata.length} piece(s) failed to persist:\n${failures.join('\n')}`)
  }
};

const main = async () => {
  console.log('update pieces metadata: started')

  const piecesMetadata = await findNewPieces()
  const currentRelease = (await readPackageJson('.')).version

  const servable = piecesMetadata.filter((pieceMetadata) => isServableOnCurrentRelease({ pieceMetadata, currentRelease }))
  const unservable = piecesMetadata.filter((pieceMetadata) => !isServableOnCurrentRelease({ pieceMetadata, currentRelease }))

  await insertMetadata(servable)

  if (unservable.length > 0) {
    const details = unservable
      .map((pieceMetadata) => `  ${pieceMetadata.name}@${pieceMetadata.version} requires ${pieceMetadata.minimumSupportedRelease}`)
      .join('\n')
    throw new Error(`[updatePiecesMetadata] ${unservable.length} piece(s) declare a minimumSupportedRelease above the current release ${currentRelease} and were skipped. The catalog would store them but never serve them, so the previous version stays live:\n${details}\nEither bump the root package.json version to the required release, or lower minimumSupportedRelease on these pieces.`)
  }

  console.log('update pieces metadata: completed')
  process.exit()
}

main()
