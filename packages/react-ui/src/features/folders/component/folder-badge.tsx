import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';

import { foldersApi } from '../lib/folders-api';

type FolderBadgeProps = {
  folderId: string;
};

const FolderBadge = ({ folderId }: FolderBadgeProps) => {
  const { data } = useQuery({
    queryKey: ['folder', folderId],
    queryFn: () => foldersApi.get(folderId),
    staleTime: Infinity,
  });

  return (
    <Badge variant={'outline'}>
      <span>{data?.displayName}</span>
    </Badge>
  );
};
export { FolderBadge };
