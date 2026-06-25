import { PieceSet, ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pieceSetMutations } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { projectHooks } from '@/features/projects';
import { cn } from '@/lib/utils';

type PieceSetDetailsSheetProps = {
  pieceSet: PieceSet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PieceSetDetailsSheet = ({
  pieceSet,
  open,
  onOpenChange,
}: PieceSetDetailsSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[640px] sm:max-w-[640px] flex flex-col p-0 gap-0">
        {pieceSet && <PieceSetDetailsContent pieceSet={pieceSet} />}
      </SheetContent>
    </Sheet>
  );
};

const PieceSetDetailsContent = ({ pieceSet }: { pieceSet: PieceSet }) => {
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

  const handleToggle = (
    field: 'includeNewPieces' | 'includeNewActions',
    value: boolean,
  ) => {
    updateSet({ id: pieceSet.id, request: { [field]: value } });
  };

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <SheetTitle className="text-base">{pieceSet.name}</SheetTitle>
          {pieceSet.isDefault && (
            <Badge variant="secondary">{t('Default')}</Badge>
          )}
        </div>
      </SheetHeader>

      <div className="px-6 py-3 border-b shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t('Include new pieces by default')}
          </span>
          <Switch
            checked={pieceSet.includeNewPieces}
            disabled={isPending}
            onCheckedChange={(v) => handleToggle('includeNewPieces', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t('Include new actions by default')}
          </span>
          <Switch
            checked={pieceSet.includeNewActions}
            disabled={isPending}
            onCheckedChange={(v) => handleToggle('includeNewActions', v)}
          />
        </div>
      </div>

      <Tabs defaultValue="pieces" className="flex flex-col flex-1 min-h-0">
        <TabsList
          variant="outline"
          className="border-b px-6 w-full rounded-none justify-start shrink-0"
        >
          <TabsTrigger variant="outline" value="pieces">
            {t('Pieces')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="projects">
            {t('Projects')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pieces" className="flex-1 overflow-y-auto mt-0 p-0">
          <PiecesTabContent pieceSet={pieceSet} />
        </TabsContent>
        <TabsContent
          value="projects"
          className="flex-1 overflow-y-auto mt-0 p-0"
        >
          <ProjectsTabContent pieceSet={pieceSet} />
        </TabsContent>
      </Tabs>
    </>
  );
};

const PiecesTabContent = ({ pieceSet }: { pieceSet: PieceSet }) => {
  const { pieces, isLoading } = piecesHooks.usePieces({
    includeHidden: false,
    skipProjectFilter: true,
  });
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

  const togglePiece = (pieceName: string, currentlyIncluded: boolean) => {
    if (currentlyIncluded) {
      updateSet({ id: pieceSet.id, request: { disablePieces: [pieceName] } });
    } else {
      updateSet({ id: pieceSet.id, request: { enablePieces: [pieceName] } });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="divide-y">
      {(pieces ?? []).map((piece) => {
        const included = !pieceSet.config.disabledPieces.includes(piece.name);
        return (
          <div
            key={piece.name}
            className={cn(
              'flex items-center gap-3 px-6 py-3',
              isPending && 'opacity-50 pointer-events-none',
            )}
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {piece.displayName}
              </span>
            </div>
            <Switch
              checked={included}
              onCheckedChange={() => togglePiece(piece.name, included)}
            />
          </div>
        );
      })}
    </div>
  );
};

const ProjectsTabContent = ({ pieceSet }: { pieceSet: PieceSet }) => {
  const { data: platformsData, isLoading } =
    projectHooks.useProjectsForPlatforms();
  const { mutate: removeProject, isPending: isRemoving } =
    pieceSetMutations.useRemoveProject();

  const assignedProjects = useMemo<ProjectWithLimits[]>(() => {
    if (!platformsData) return [];
    return platformsData
      .flatMap((p) => p.projects)
      .filter((project) => project.pieceSetId === pieceSet.id);
  }, [platformsData, pieceSet.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assignedProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        {t('No projects assigned')}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {assignedProjects.map((project) => (
        <div key={project.id} className="flex items-center gap-3 px-6 py-3">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate">
              {project.displayName}
            </span>
          </div>
          {!pieceSet.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              loading={isRemoving}
              onClick={() =>
                removeProject({ id: pieceSet.id, projectId: project.id })
              }
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
