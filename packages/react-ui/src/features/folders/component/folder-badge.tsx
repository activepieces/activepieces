import { useQuery } from '@tanstack/react-query';

import { foldersApi } from '../lib/folders-api';

import { Badge } from '@/components/ui/badge';

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
