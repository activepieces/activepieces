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

const findUnsupportedReason = ({ pieceMetadata, currentRelease }: { pieceMetadata: PieceMetadata, currentRelease: string }): string | null => {
  const { minimumSupportedRelease, maximumSupportedRelease } = pieceMetadata

  if (!semver.valid(currentRelease)) {
    return null
  }

  if (maximumSupportedRelease && semver.valid(maximumSupportedRelease) && semver.gt(currentRelease, maximumSupportedRelease)) {
    return `maximumSupportedRelease ${maximumSupportedRelease} is below it`
  }

  if (minimumSupportedRelease && semver.valid(minimumSupportedRelease) && semver.gt(minimumSupportedRelease, currentRelease)) {
    return `minimumSupportedRelease ${minimumSupportedRelease} is above it`
  }

  return null
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

  const evaluated = piecesMetadata.map((pieceMetadata) => ({
    pieceMetadata,
    unsupportedReason: findUnsupportedReason({ pieceMetadata, currentRelease }),
  }))

  const servable = evaluated.filter((entry) => entry.unsupportedReason === null).map((entry) => entry.pieceMetadata)
  const unservable = evaluated.filter((entry) => entry.unsupportedReason !== null)

  await insertMetadata(servable)

  if (unservable.length > 0) {
    const details = unservable
      .map((entry) => `  ${entry.pieceMetadata.name}@${entry.pieceMetadata.version}: ${entry.unsupportedReason}`)
      .join('\n')
    throw new Error(`[updatePiecesMetadata] ${unservable.length} piece(s) are not compatible with the current release ${currentRelease} and were skipped. The catalog would store them but never serve them, so the previous compatible version stays live:\n${details}\nEither align the root package.json version with the range these pieces declare, or widen minimumSupportedRelease/maximumSupportedRelease on them.`)
  }

  console.log('update pieces metadata: completed')
  process.exit()
}

main()
