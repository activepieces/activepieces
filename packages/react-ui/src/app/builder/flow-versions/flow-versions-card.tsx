import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Eye, EyeIcon, Pencil } from 'lucide-react';
import React, { useState } from 'react';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { CardListItem } from '@/components/custom/card-list';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { formatUtils } from '@/lib/utils';
import {
  FlowVersionMetadata,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';

type UseAsDraftOptionProps = {
  versionNumber: number;
  onConfirm: () => void;
};
const UseAsDraftDropdownMenuOption = ({
  versionNumber,
  onConfirm,
}: UseAsDraftOptionProps) => {
  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);

  return (
    <Dialog>
      <DialogTrigger
        disabled={!userHasPermissionToWriteFlow}
        className="w-full"
      >
        <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
          <DropdownMenuItem
            className="w-full"
            onSelect={(e) => {
              e.preventDefault();
            }}
            disabled={!userHasPermissionToWriteFlow}
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>{t('Use as Draft')}</span>
          </DropdownMenuItem>
        </PermissionNeededTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Are you sure?')}</DialogTitle>
          <DialogDescription>
            {t('Your current draft version will be overwritten with')}{' '}
            <span className="font-semibold">
              {t('version #')}
              {versionNumber}
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button variant={'outline'}>{t('Cancel')}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => onConfirm()}>{t('Confirm')}</Button>
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
  publishedVersionId: string | undefined | null;
  flowVersionNumber: number;
};
const FlowVersionDetailsCard = React.memo(
  ({
    flowVersion,
    flowVersionNumber,
    selected,
    publishedVersionId,
  }: FlowVersionDetailsCardProps) => {
    const { checkAccess } = useAuthorization();
    const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
    const [setBuilderVersion, setLeftSidebar, setReadonly] =
      useBuilderStateContext((state) => [
        state.setVersion,
        state.setLeftSidebar,
        state.setReadOnly,
      ]);
    const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
    const { mutate: viewVersion, isPending } = flowsHooks.useFetchFlowVersion({
      onSuccess: (populatedFlowVersion) => {
        setBuilderVersion(populatedFlowVersion);
        setReadonly(
          populatedFlowVersion.state === FlowVersionState.LOCKED ||
            !userHasPermissionToWriteFlow,
        );
      },
    });

    const { mutate: overWriteDraftWithVersion, isPending: isDraftPending } =
      flowsHooks.useOverWriteDraftWithVersion({
        onSuccess: (populatedFlowVersion) => {
          setBuilderVersion(populatedFlowVersion.version);
          setLeftSidebar(LeftSideBarType.NONE);
        },
      });

    const handleOverwriteDraftWtihVersion = () => {
      overWriteDraftWithVersion(flowVersion);
      setDropdownMenuOpen(false);
    };

    const showAvatar = !useEmbedding().embedState.isEmbedded;

    return (
      <CardListItem interactive={false}>
        {showAvatar && flowVersion.updatedByUser && (
          <UserAvatar
            size={28}
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
            {t('Version')} {flowVersionNumber}
          </p>
        </div>
        <div className="flex-grow"></div>
        <div className="flex font-medium gap-2 justify-center items-center">
          {selected && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="size-10 flex justify-center items-center">
                  <EyeIcon className="w-5 h-5 "></EyeIcon>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t('Viewing')}</TooltipContent>
            </Tooltip>
          )}

          <FlowVersionStateDot
            state={flowVersion.state}
            versionId={flowVersion.id}
            publishedVersionId={publishedVersionId}
          ></FlowVersionStateDot>

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
                {(isPending || isDraftPending) && <LoadingSpinner />}
                {!isPending && !isDraftPending && <DotsVerticalIcon />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              <DropdownMenuItem
                onClick={() => viewVersion(flowVersion)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>{t('View')}</span>
              </DropdownMenuItem>
              {flowVersion.state !== FlowVersionState.DRAFT && (
                <UseAsDraftDropdownMenuOption
                  versionNumber={flowVersionNumber}
                  onConfirm={handleOverwriteDraftWtihVersion}
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
