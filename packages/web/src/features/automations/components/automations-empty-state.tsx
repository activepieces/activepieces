import { Permission } from '@activepieces/core-utils';
import {
  Template,
  TemplateType,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ChevronRight,
  Plus,
  Sparkles,
  Table2,
  Upload,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageSection } from '@/components/custom/page';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { TagWithBright } from '@/components/custom/tag-with-bright';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { ImportTableDialog } from '@/features/tables/components/import-table-dialog';
import { tableHooks } from '@/features/tables/hooks/table-hooks';
import { TemplatesBrowseDialog } from '@/features/templates';
import { UseTemplateDialog } from '@/features/templates/components/use-template-dialog';
import { templatesHooks } from '@/features/templates/hooks/templates-hook';
import { useGradientFromPieces } from '@/features/templates/hooks/use-gradient-from-pieces';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

type SuggestedTemplateCardProps = {
  template: Template;
  onSelect: (template: Template) => void;
};

const SuggestedTemplateCard = ({
  template,
  onSelect,
}: SuggestedTemplateCardProps) => {
  const hasFlows = template.flows && template.flows.length > 0;
  const { gradient } = useGradientFromPieces(
    hasFlows ? template.flows![0]?.trigger : undefined,
  );

  const displayTags = template.tags.slice(0, 1);

  return (
    <Card
      onClick={() => onSelect(template)}
      variant="interactive"
      className="h-[220px] gap-0 pb-0"
    >
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2">
        <h3 className="line-clamp-2 min-h-10 shrink-0 text-sm font-semibold">
          {template.name}
        </h3>

        <p className="line-clamp-2 shrink-0 text-xs text-gray-11">
          {template.summary || (
            <span className="italic">{t('No summary')}</span>
          )}
        </p>

        <div className="flex h-8 shrink-0 flex-wrap gap-2 overflow-hidden">
          {displayTags.length > 0 &&
            displayTags.map((tag, index) => (
              <TagWithBright
                key={index}
                index={index}
                prefix={t('Save')}
                title={tag.title}
                color={tag.color}
                size="sm"
              />
            ))}
        </div>
      </CardContent>

      <div
        className="flex h-14 shrink-0 items-center px-4 transition-all duration-300"
        style={{
          background: gradient || 'rgba(0,0,0,0.02)',
        }}
      >
        {hasFlows && template.flows![0]?.trigger && (
          <PieceIconList
            trigger={template.flows![0]?.trigger}
            maxNumberOfIconsToShow={4}
            size="md"
            className="flex gap-0.5"
            excludeCore={true}
          />
        )}
      </div>
    </Card>
  );
};

const TemplateCardSkeleton = () => {
  return (
    <Card className="h-[220px] gap-0 pb-0">
      <CardContent className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-24" />
      </CardContent>
      <div className="h-14 bg-gray-2" />
    </Card>
  );
};

type AutomationsEmptyStateProps = {
  onRefresh: () => void;
};

export const AutomationsEmptyState = ({
  onRefresh,
}: AutomationsEmptyStateProps) => {
  const navigate = useNavigate();
  const { embedState } = useEmbedding();
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] = useState(false);
  const [isTemplatesBrowseDialogOpen, setIsTemplatesBrowseDialogOpen] =
    useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);

  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToWriteTable = checkAccess(Permission.WRITE_TABLE);

  const { platform } = platformHooks.useCurrentPlatform();
  const isShowingOfficialTemplates = !platform.plan.manageTemplatesEnabled;

  const { templates, isLoading: isLoadingTemplates } =
    templatesHooks.useTemplates(
      isShowingOfficialTemplates ? TemplateType.OFFICIAL : TemplateType.CUSTOM,
    );

  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const { mutate: createTable, isPending: isCreateTablePending } =
    tableHooks.useCreateTable(UncategorizedFolderId);

  const handleTemplateSelect = (template: Template) => {
    if (embedState.isEmbedded) {
      setSelectedTemplate(template);
      setUseTemplateDialogOpen(true);
    } else {
      navigate(`/templates/${template.id}`);
    }
  };

  const handleViewAllTemplates = () => {
    if (embedState.isEmbedded) {
      setIsTemplatesBrowseDialogOpen(true);
    } else {
      navigate('/templates');
    }
  };

  const topTemplates = templates?.slice(0, 3) || [];
  const hasTemplates = topTemplates.length > 0;

  return (
    <>
      <div className="rounded-2xl bg-panel shadow-edge">
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Workflow />
            </EmptyMedia>
            <EmptyTitle>{t('Nothing built yet')}</EmptyTitle>
            <EmptyDescription>
              {embedState.hideTables
                ? t(
                    'A flow runs a fixed sequence of steps when something happens. Folders keep your flows organised.',
                  )
                : t(
                    'A flow runs a fixed sequence of steps when something happens. A table gives a flow somewhere to store rows. Folders keep both organised.',
                  )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center gap-2">
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToWriteFlow}
            >
              <Button
                disabled={!userHasPermissionToWriteFlow}
                loading={isCreateFlowPending}
                onClick={() => createFlow()}
              >
                <Plus />
                {t('New flow')}
              </Button>
            </PermissionNeededTooltip>
            {!embedState.hideTables && (
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteTable}
              >
                <Button
                  variant="outline"
                  disabled={!userHasPermissionToWriteTable}
                  loading={isCreateTablePending}
                  onClick={() => createTable({ name: t('New table') })}
                >
                  <Table2 />
                  {t('New table')}
                </Button>
              </PermissionNeededTooltip>
            )}
            {!embedState.hideExportAndImportFlow && (
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteFlow}
              >
                <ImportFlowDialog
                  insideBuilder={false}
                  onRefresh={onRefresh}
                  folderId={UncategorizedFolderId}
                >
                  <Button
                    variant="outline"
                    disabled={!userHasPermissionToWriteFlow}
                  >
                    <Upload />
                    {t('Import flow')}
                  </Button>
                </ImportFlowDialog>
              </PermissionNeededTooltip>
            )}
          </EmptyContent>
        </Empty>
      </div>

      {(hasTemplates || isLoadingTemplates) && (
        <PageSection
          title={
            <span className="flex items-center gap-2">
              {t('Templates for you')}
              <Sparkles className="size-4 text-swatch-6-mark" />
            </span>
          }
          action={
            <Button variant="ghost" size="sm" onClick={handleViewAllTemplates}>
              {t('All templates')}
              <ChevronRight />
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {isLoadingTemplates ? (
              <>
                <TemplateCardSkeleton />
                <TemplateCardSkeleton />
                <TemplateCardSkeleton />
              </>
            ) : (
              topTemplates.map((template) => (
                <SuggestedTemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))
            )}
          </div>
        </PageSection>
      )}

      {!embedState.hideTables && (
        <ImportTableDialog
          open={isImportTableDialogOpen}
          setIsOpen={setIsImportTableDialogOpen}
          showTrigger={false}
        />
      )}
      <TemplatesBrowseDialog
        open={isTemplatesBrowseDialogOpen}
        onOpenChange={setIsTemplatesBrowseDialogOpen}
      />
      {selectedTemplate && (
        <UseTemplateDialog
          key={selectedTemplate.id}
          template={selectedTemplate}
          open={useTemplateDialogOpen}
          onOpenChange={(isOpen) => {
            setUseTemplateDialogOpen(isOpen);
            if (!isOpen) setSelectedTemplate(null);
          }}
        />
      )}
    </>
  );
};
