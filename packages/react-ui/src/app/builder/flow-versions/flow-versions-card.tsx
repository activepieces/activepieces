import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { Eye, Pencil } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { CardListItem } from '@/components/ui/card-list';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useBuilderStateContext } from '@/hooks/builder-hooks';
import { formatUtils } from '@/lib/utils';
import { FlowVersion, FlowVersionMetadata } from '@activepieces/shared';

type FlowVersionDetailsCardProps = {
  flowVersion: FlowVersionMetadata;
  index: number;
};

const FlowVersionDetailsCard = React.memo(
  ({ flowVersion, index }: FlowVersionDetailsCardProps) => {
    const { setVersion } = useBuilderStateContext((state) => state);

    const { mutate, isPending } = useMutation<
      FlowVersion,
      Error,
      FlowVersionMetadata
    >({
      mutationFn: async (flowVersion) => {
        const result = await flowsApi.get(flowVersion.flowId, {
          versionId: flowVersion.id,
        });
        return result.version;
      },
      onSuccess: (populatedFlowVersion) => {
        setVersion(populatedFlowVersion);
      },
      onError: (error) => {
        toast(INTERNAL_ERROR_TOAST);
        console.error(error);
      },
    });
    // TODO FIX loading
    return (
      <CardListItem>
        <div className="grid gap-2">
          <p className="text-sm font-medium leading-none">
            {formatUtils.formatDate(new Date(flowVersion.created))}
          </p>
          <p className="flex gap-1 text-xs text-muted-foreground">
            Version {index + 1}
          </p>
        </div>
        <div className="ml-auto font-medium">
          {isPending && <LoadingSpinner className="w-5 h-5"></LoadingSpinner>}
          {!isPending && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" disabled={isPending}>
                  {isPending && <LoadingSpinner className="w-5 h-5" />}
                  {!isPending && <DotsVerticalIcon className="w-5 h-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => mutate(flowVersion)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Use as Draft</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardListItem>
    );
  },
);

FlowVersionDetailsCard.displayName = 'FlowVersionDetailsCard';
export { FlowVersionDetailsCard };
