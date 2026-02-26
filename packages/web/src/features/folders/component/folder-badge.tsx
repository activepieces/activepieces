import { t } from 'i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { foldersHooks } from '../lib/folders-hooks';

type FolderBadgeProps = {
  folderId: string;
};

const FolderBadge = ({ folderId }: FolderBadgeProps) => {
  const { data } = foldersHooks.useFolder(folderId);

  return (
    <div>
      {data ? (
        <span>{data.displayName}</span>
      ) : (
        <Skeleton
          className="rounded-full h-6 w-24"
          aria-label={t('Loading...')}
        />
      )}
    </div>
  );
};
export { FolderBadge };
