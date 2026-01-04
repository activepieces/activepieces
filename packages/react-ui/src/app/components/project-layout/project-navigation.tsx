import { t } from 'i18next';
import {
  Folder,
  History,
  Link2,
  Package,
  Table2,
  Workflow,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TextWithIcon } from '@/components/ui/text-with-icon';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { CreateFolderDialog } from '@/features/folders/component/create-folder-dialog';
import { FolderActions } from '@/features/folders/component/folder-actions';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto, Permission } from '@activepieces/shared';

const FolderIcon = () => {
  return <Folder className="w-4 h-4" />;
};

type FolderItemProps = {
  folder: FolderDto;
  refetch: () => void;
  updateSearchParams: (folderId: string | undefined) => void;
  selectedFolderId: string | null;
};

const FolderItem = ({
  folder,
  refetch,
  updateSearchParams,
  selectedFolderId,
}: FolderItemProps) => {
  return (
    <div key={folder.id} className="group">
      <Button
        variant="ghost"
        className={cn(
          'w-full items-center justify-start group/item gap-2 pl-4 pr-0',
          {
            'bg-accent dark:bg-accent/50': selectedFolderId === folder.id,
          },
        )}
        onClick={() => updateSearchParams(folder.id)}
      >
        <TextWithIcon
          className="grow"
          icon={<FolderIcon />}
          text={
            <div
              className={cn(
                'grow max-w-[150px] text-start truncate whitespace-nowrap overflow-hidden',
                {
                  'font-medium': selectedFolderId === folder.id,
                },
              )}
            >
              {folder.displayName}
            </div>
          }
        >
          <FolderActions folder={folder} refetch={refetch} />
        </TextWithIcon>
      </Button>
    </div>
  );
};

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  show: boolean;
  hasPermission: boolean;
};

export const folderIdParamName = 'folderId';

export const ProjectNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const { embedState } = useEmbedding();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);
  const [searchParams, setSearchParams] = useSearchParams(location.search);
  const selectedFolderId = searchParams.get(folderIdParamName);

  const navItems: NavItem[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/flows'),
      label: t('Flows'),
      icon: Workflow,
      show: true,
      hasPermission: checkAccess(Permission.READ_FLOW),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/tables'),
      label: t('Tables'),
      icon: Table2,
      show: platform.plan.tablesEnabled,
      hasPermission: checkAccess(Permission.READ_TABLE),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      label: t('Runs'),
      icon: History,
      show: true,
      hasPermission: checkAccess(Permission.READ_RUN),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: Link2,
      show: true,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/releases'),
      label: t('Releases'),
      icon: Package,
      show: project.releasesEnabled,
      hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
    },
  ];

  const updateSearchParams = (folderId: string | undefined) => {
    const newQueryParameters: URLSearchParams = new URLSearchParams(
      searchParams,
    );
    if (folderId) {
      newQueryParameters.set(folderIdParamName, folderId);
    } else {
      newQueryParameters.delete(folderIdParamName);
    }
    newQueryParameters.delete('cursor');

    setSearchParams(newQueryParameters);
  };

  const {
    folders,
    isLoading,
    refetch: refetchFolders,
  } = foldersHooks.useFolders();

  const isNavItemActive = (to: string) => {
    return location.pathname.includes(to);
  };

  if (embedState.hideFolders) {
    return null;
  }

  return (
    <div className="w-[250px] shrink-0">
  
      <div className="flex flex-col gap-y-1 mb-4">
        {navItems
          .filter((item) => item.show && item.hasPermission)
          .map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              className={cn('flex w-full justify-start pl-4 pr-0', {
                'bg-accent dark:bg-accent/50': isNavItemActive(item.to),
              })}
              onClick={() => navigate(item.to)}
            >
              <TextWithIcon
                icon={<item.icon className="w-4 h-4" />}
                text={
                  <div
                    className={cn(
                      'grow whitespace-break-spaces break-all text-start truncate',
                      {
                        'font-medium': isNavItemActive(item.to),
                      },
                    )}
                  >
                    {item.label}
                  </div>
                }
              />
            </Button>
          ))}
      </div>

      <Separator className="mb-4" />

      {/* Folders Section */}
      <div className="flex flex-row items-center mb-2">
        <span className="flex text-sm font-medium">{t('Folders')}</span>
        <div className="grow"></div>
        <div className="flex items-center justify-center">
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFolders}
          >
            <CreateFolderDialog
              refetchFolders={refetchFolders}
              updateSearchParams={updateSearchParams}
            />
          </PermissionNeededTooltip>
        </div>
      </div>
      <div className="flex h-full flex-col gap-y-1">
        <ScrollArea type="auto">
          <div className="flex flex-col w-full gap-y-1 max-h-[590px]">
            {isLoading && (
              <div className="flex flex-col gap-2">
                {Array.from(Array(5)).map((_, index) => (
                  <Skeleton key={index} className="rounded-md w-full h-8" />
                ))}
              </div>
            )}
            {folders &&
              folders.map((folder) => {
                return (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    refetch={refetchFolders}
                    selectedFolderId={selectedFolderId}
                    updateSearchParams={updateSearchParams}
                  />
                );
              })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

