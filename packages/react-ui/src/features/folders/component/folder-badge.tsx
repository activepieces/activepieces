import { Badge } from '@/components/ui/badge';

import { foldersHooks } from '../lib/folders-hooks';

type FolderBadgeProps = {
  folderId: string;
};

const FolderBadge = ({ folderId }: FolderBadgeProps) => {
  const { data } = foldersHooks.useFolder(folderId);

  return (
    <Badge variant={'outline'}>
      <span>{data?.displayName}</span>
    </Badge>
  );
};
export { FolderBadge };
