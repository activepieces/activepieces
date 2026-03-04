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
  const sharedDeps = ['packages/pieces/framework', 'packages/pieces/common']
  
  const sharedResults = await Promise.all(sharedDeps.map(packagePrePublishChecks))
  const validationResults = await processBatches(
    piecesMetadata.filter(p => !sharedDeps.includes(p)),
    10,
    packagePrePublishChecks
  )

  if (!sharedResults.every(p => p)) {
    validationResults.push(await packagePrePublishChecks('packages/shared'))
  }
}

main();
