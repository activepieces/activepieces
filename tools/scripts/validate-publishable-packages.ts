import { findAllPiecesDirectoryInSource } from './utils/piece-script-utils';
import { packagePrePublishChecks } from './utils/package-pre-publish-checks';

async function processBatches<T>(items: T[], batchSize: number, processor: (item: T) => Promise<any>): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...await Promise.all(batch.map(processor)));
    if (i + batchSize < items.length) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return results;
}

const main = async () => {
  const piecesMetadata = await findAllPiecesDirectoryInSource()
  // pieces-framework, pieces-common and @activepieces/shared are no longer published to npm:
  // pieces are self-contained bundles that inline these at build time. Exclude them from the
  // publishable-package validation and only validate the pieces themselves.
  const notPublished = ['packages/pieces/framework', 'packages/pieces/common']
  await processBatches(
    piecesMetadata.filter(p => !notPublished.includes(p)),
    10,
    packagePrePublishChecks
  )
}

main();
