import { getAvailablePieceNames } from './utils/get-available-piece-names';
import { packagePrePublishChecks } from './utils/package-pre-publish-checks';

const main = async () => {
  const piecePackageNames = await getAvailablePieceNames()

  const packages = [
    ...piecePackageNames.map(p => `packages/pieces/${p}`),
    'packages/pieces/framework',
    'packages/shared',
  ]

  const validationResults = packages.map(p => packagePrePublishChecks(p))

  Promise.all(validationResults);
}

main();
