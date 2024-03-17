import {findAllPiecesDirectoryInSource } from './utils/piece-script-utils';
import { packagePrePublishChecks } from './utils/package-pre-publish-checks';

const main = async () => {
  const piecesMetadata = await findAllPiecesDirectoryInSource()

  const packages = [
    ...piecesMetadata,
    'packages/pieces/community/framework',
    'packages/shared',
    'packages/pieces/community/common',
  ]

  const validationResults = packages.map(p => packagePrePublishChecks(p))

  Promise.all(validationResults);
}

main();
