import { FolderDto } from '@activepieces/shared';

export const foldersUtils = {
  extractUncategorizedFlows: (
    allFlowsCount?: number,
    folders?: FolderDto[],
  ) => {
    let uncategorizedCount = allFlowsCount ?? 0;

    folders?.forEach((folder) => {
      uncategorizedCount = uncategorizedCount - folder.numberOfFlows;
    });

    return uncategorizedCount;
  },
};
