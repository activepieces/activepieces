import { t } from 'i18next';
import { ArrowLeft, Layers, LayoutGrid, Loader2, Puzzle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';

import { PieceSetPiecesTab } from './piece-set-pieces-tab';
import { PieceSetProjectsTab } from './piece-set-projects-tab';

const PieceSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pieceSet, isLoading } = pieceSetQueries.usePieceSet(id ?? '');
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

  const handleToggle = (
    field: 'includeNewPieces' | 'includeNewActions',
    value: boolean,
  ) => {
    if (!pieceSet) return;
    updateSet({ id: pieceSet.id, request: { [field]: value } });
  };

  if (isLoading || !pieceSet) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/platform/setup/pieces?tab=piece-sets')}
              className="p-1 h-auto"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Layers className="size-5" />
            <span>{pieceSet.name}</span>
            {pieceSet.isDefault && (
              <Badge variant="secondary">{t('Default')}</Badge>
            )}
          </div>
        }
        description={t(
          'Configure which pieces and actions are available in this set',
        )}
      />

      <div className="mx-auto w-full flex flex-col flex-1 min-h-0 gap-0">
        <div className="px-4 pt-3 pb-6 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between max-w-md">
            <span className="text-sm font-medium">
              {t('Include new pieces by default')}
            </span>
            <Switch
              checked={pieceSet.includeNewPieces}
              disabled={isPending}
              onCheckedChange={(v) => handleToggle('includeNewPieces', v)}
            />
          </div>
          <div className="flex items-center justify-between max-w-md">
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
            className="border-b w-full rounded-none justify-start shrink-0"
          >
            <TabsTrigger variant="outline" value="pieces">
              <Puzzle className="size-4 mr-2" />
              {t('Pieces')}
            </TabsTrigger>
            <TabsTrigger variant="outline" value="projects">
              <LayoutGrid className="size-4 mr-2" />
              {t('Projects')}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="pieces"
            className="flex-1 min-h-0 flex flex-col mt-0"
          >
            <PieceSetPiecesTab pieceSet={pieceSet} />
          </TabsContent>
          <TabsContent
            value="projects"
            className="flex-1 min-h-0 flex flex-col mt-0"
          >
            <PieceSetProjectsTab pieceSet={pieceSet} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };
