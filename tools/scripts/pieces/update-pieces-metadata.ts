import assert from 'node:assert';
import { PieceMetadata } from '../../../packages/pieces/framework/src';
import { StatusCodes } from 'http-status-codes';
import { HttpHeader } from '../../../packages/pieces/common/src';
import { AP_CLOUD_API_BASE, findNewPieces, pieceMetadataExists } from '../utils/piece-script-utils';
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

  const insertFailures = await insertMetadata(pieces)

  if (insertFailures.length > 0) {
    console.error(`update pieces metadata: ${insertFailures.length} of ${pieces.length} piece(s) failed to insert on Cloud:`)
    for (const insertFailure of insertFailures) {
      console.error(`  - ${insertFailure}`)
    }
  }

  if (failures.length > 0 || insertFailures.length > 0) {
    process.exit(1)
  }

  console.log('update pieces metadata: completed')
  process.exit()
}

main()
