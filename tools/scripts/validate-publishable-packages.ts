import { findAllPiecesDirectoryInSource } from './utils/piece-script-utils';
import { packagePrePublishChecks } from './utils/package-pre-publish-checks';

const main = async () => {
  const piecesMetadata = await findAllPiecesDirectoryInSource()

  const sharedDependencies = ['packages/pieces/community/framework', 'packages/pieces/community/common']
  const packages = [
    ...piecesMetadata,
  ]
  const validationResults = packages.filter(p => !sharedDependencies.includes(p)).map(p => packagePrePublishChecks(p))
  const sharedDependenciesValidationResults = await Promise.all(sharedDependencies.map(p => packagePrePublishChecks(p)))

  const isSharedDependenciesChanged = !sharedDependenciesValidationResults.every(p => p)

  if (isSharedDependenciesChanged) {
    validationResults.push(packagePrePublishChecks('packages/shared'))
  }

  Promise.all(validationResults);
}

main();
