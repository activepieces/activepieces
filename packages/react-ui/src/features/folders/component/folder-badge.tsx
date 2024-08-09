import { Badge } from '@/components/ui/badge';
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
        <Badge variant={'outline'}>
          <span>{data.displayName}</span>
        </Badge>
      ) : (
        <Skeleton className="rounded-full h-6 w-24" />
      )}
    </div>
  );
};
export { FolderBadge };
