import assert from 'node:assert';
import * as semver from 'semver';
import { PieceMetadata } from '../../../packages/pieces/framework/src';
import { StatusCodes } from 'http-status-codes';
import { HttpHeader } from '../../../packages/pieces/common/src';
import { AP_CLOUD_API_BASE, findNewPieces, pieceMetadataExists } from '../utils/piece-script-utils';
import { readPackageJson } from '../utils/files';
import { cloudApiFetch } from '../utils/cloud-api-fetch';
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

  const cloudResponse = await cloudApiFetch.fetchWithRetry({
    url: `${AP_CLOUD_API_BASE}/admin/pieces`,
    init: { method: 'POST', headers, body },
  });

  if (cloudResponse.status !== StatusCodes.OK && cloudResponse.status !== StatusCodes.CONFLICT) {
    const responseText = await cloudResponse.text();
    throw new Error(`[insertPieceMetadata] ${pieceMetadata.name}@${pieceMetadata.version} status=${cloudResponse.status} body=${responseText.slice(0, 500)}`);
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

const insertMetadata = async (piecesMetadata: PieceMetadata[]): Promise<string[]> => {
  const batches = chunk(piecesMetadata, 30)
  const insertFailures: string[] = []
  for (const batch of batches) {
    const results = await Promise.allSettled(batch.map(insertMetadataIfNotExist))
    insertFailures.push(...results.flatMap((result, index) =>
      result.status === 'rejected' ? [`${batch[index].name}@${batch[index].version}: ${describeReason(result.reason)}`] : [],
    ))
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  return insertFailures
};

function describeReason(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason)
}

const main = async () => {
  console.log('update pieces metadata: started')

  const { pieces, failures } = await findNewPieces()

  if (failures.length > 0) {
    console.error(`update pieces metadata: ${failures.length} piece(s) failed to load or to check against Cloud:`)
    for (const failure of failures) {
      console.error(`  - ${failure.path}: ${failure.error}`)
    }
  }

  const currentRelease = (await readPackageJson('.')).version
  const evaluated = pieces.map((pieceMetadata) => ({
    pieceMetadata,
    unsupportedReason: findUnsupportedReason({ pieceMetadata, currentRelease }),
  }))
  const servable = evaluated.filter((entry) => entry.unsupportedReason === null).map((entry) => entry.pieceMetadata)
  const unservable = evaluated
    .filter((entry) => entry.unsupportedReason !== null)
    .map((entry) => `${entry.pieceMetadata.name}@${entry.pieceMetadata.version}: ${entry.unsupportedReason}`)

  const insertFailures = await insertMetadata(servable)

  if (insertFailures.length > 0) {
    console.error(`update pieces metadata: ${insertFailures.length} of ${servable.length} piece(s) failed to insert on Cloud:`)
    for (const insertFailure of insertFailures) {
      console.error(`  - ${insertFailure}`)
    }
  }

  if (unservable.length > 0) {
    console.error(`update pieces metadata: ${unservable.length} piece(s) are not compatible with the current release ${currentRelease} and were skipped. The catalog would store them but never serve them, so the previous compatible version stays live:`)
    for (const entry of unservable) {
      console.error(`  - ${entry}`)
    }
    console.error('Either align the root package.json version with the range these pieces declare, or widen minimumSupportedRelease/maximumSupportedRelease on them.')
  }

  if (failures.length > 0 || insertFailures.length > 0 || unservable.length > 0) {
    process.exit(1)
  }

  console.log('update pieces metadata: completed')
  process.exit()
}

main()
