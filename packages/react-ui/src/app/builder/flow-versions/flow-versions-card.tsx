import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeIcon, Pencil } from 'lucide-react';
import React, { useState } from 'react';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { AvatarLetter } from '@/components/ui/avatar-letter';
import { Button } from '@/components/ui/button';
import { CardListItem } from '@/components/ui/card-list';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { formatUtils } from '@/lib/utils';
import {
  FlowOperationType,
  FlowVersion,
  FlowVersionMetadata,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';

type UseAsDraftOptionProps = {
  versionIndex: number;
  onConfirm: () => void;
};
const UseAsDraftDropdownMenuOption = ({
  versionIndex,
  onConfirm,
}: UseAsDraftOptionProps) => {
  return (
    <Dialog>
      <DialogTrigger className="w-full">
        <DropdownMenuItem
          className="w-full"
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          <span>Use as Draft</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            Your current draft version will be overwritten with{' '}
            <span className="font-semibold">version #{versionIndex + 1}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button variant={'outline'}>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => onConfirm()}>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
UseAsDraftDropdownMenuOption.displayName = 'UseAsDraftDropdownMenuOption';

type FlowVersionDetailsCardProps = {
  flowVersion: FlowVersionMetadata;
  selected: boolean;
  published: boolean;
  index: number;
};
const FlowVersionDetailsCard = React.memo(
  ({
    flowVersion,
    index,
    selected,
    published,
  }: FlowVersionDetailsCardProps) => {
    const [setBuilderVersion, setLeftSidebar, setReadonly] =
      useBuilderStateContext((state) => [
        state.setVersion,
        state.setLeftSidebar,
        state.setReadOnly,
      ]);
    const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
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
        setBuilderVersion(populatedFlowVersion);
        setReadonly(populatedFlowVersion.state === FlowVersionState.LOCKED);
      },
      onError: (error) => {
        toast(INTERNAL_ERROR_TOAST);
        console.error(error);
      },
    });

    const { mutate: mutateVersionAsDraft, isPending: isDraftPending } =
      useMutation<PopulatedFlow, Error, FlowVersionMetadata>({
        mutationFn: async (flowVersion) => {
          const result = await flowsApi.update(flowVersion.flowId, {
            type: FlowOperationType.USE_AS_DRAFT,
            request: {
              versionId: flowVersion.id,
            },
          });
          return result;
        },
        onSuccess: (populatedFlowVersion) => {
          setBuilderVersion(populatedFlowVersion.version);
          setLeftSidebar(LeftSideBarType.NONE);
        },
        onError: (error) => {
          toast(INTERNAL_ERROR_TOAST);
          console.error(error);
        },
      });

    const handleOverwriteDraft = () => {
      mutateVersionAsDraft(flowVersion);
      setDropdownMenuOpen(false);
    };

    return (
      <CardListItem interactive={false}>
        {flowVersion.updatedByUser && (
          <AvatarLetter
            name={
              flowVersion.updatedByUser.firstName +
              ' ' +
              flowVersion.updatedByUser.lastName
            }
            email={flowVersion.updatedByUser.email}
          />
        )}
        <div className="grid gap-2">
          <p className="text-sm font-medium leading-none select-none pointer-events-none">
            {formatUtils.formatDate(new Date(flowVersion.created))}
          </p>
          <p className="flex gap-1 text-xs text-muted-foreground">
            Version {index + 1}
          </p>
        </div>
        <div className="flex-grow"></div>
        <div className="flex font-medium gap-2 justy-center items-center">
          {selected && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="size-10 flex justify-center items-center">
                  <EyeIcon className="w-5 h-5 "></EyeIcon>
                </div>
              </TooltipTrigger>
              <TooltipContent>Viewing</TooltipContent>
            </Tooltip>
          )}

          {flowVersion.state === FlowVersionState.DRAFT && (
            <FlowVersionStateDot
              state={flowVersion.state}
            ></FlowVersionStateDot>
          )}

          {published && flowVersion.state === FlowVersionState.LOCKED && (
            <FlowVersionStateDot
              state={flowVersion.state}
            ></FlowVersionStateDot>
          )}

          <DropdownMenu
            onOpenChange={(open) => setDropdownMenuOpen(open)}
            open={dropdownMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                disabled={isPending || isDraftPending}
                size={'icon'}
              >
                {(isPending || isDraftPending) && (
                  <LoadingSpinner className="w-5 h-5" />
                )}
                {!isPending && !isDraftPending && (
                  <DotsVerticalIcon className="w-5 h-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => mutate(flowVersion)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>View</span>
              </DropdownMenuItem>
              {flowVersion.state !== FlowVersionState.DRAFT && (
                <UseAsDraftDropdownMenuOption
                  versionIndex={index}
                  onConfirm={handleOverwriteDraft}
                ></UseAsDraftDropdownMenuOption>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardListItem>
    );
  },
);

FlowVersionDetailsCard.displayName = 'FlowVersionDetailsCard';
export { FlowVersionDetailsCard };
