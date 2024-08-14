import { foldersHooks } from '../lib/folders-hooks';

import { Skeleton } from '@/components/ui/skeleton';

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
        <Skeleton className="rounded-full h-6 w-24" />
      )}
    </div>
  );
};
export { FolderBadge };
