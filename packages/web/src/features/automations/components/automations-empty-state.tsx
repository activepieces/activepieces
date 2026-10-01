import { Permission } from '@activepieces/core-utils';
import {
  Template,
  TemplateType,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Bot,
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
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

type ActionRowProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  hasPermission?: boolean;
};

const ActionRow = ({
  icon,
  label,
  onClick,
  disabled,
  hasPermission = true,
}: ActionRowProps) => {
  const content = (
    <button
      onClick={onClick}
      disabled={disabled || !hasPermission}
      className={ACTION_ROW_CLASS}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-4 shrink-0 items-center justify-center text-gray-11 [&_svg]:size-4">
          {icon}
        </span>
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-gray-11" />
    </button>
  );

  if (!hasPermission) {
    return (
      <PermissionNeededTooltip hasPermission={hasPermission}>
        {content}
      </PermissionNeededTooltip>
    );
  }

  return content;
};

type GetStartedCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

const GetStartedCard = ({
  icon,
  title,
  description,
  children,
}: GetStartedCardProps) => {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-3 border-b p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-3 text-accent-11 [&_svg]:size-5">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-gray-11">{description}</p>
        </div>
      </div>
      <div className="flex flex-col divide-y">{children}</div>
    </Card>
  );
};

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
  agentsVisible: boolean;
  userHasPermissionToWriteAgent: boolean;
  isCreatingAgent: boolean;
  onCreateAgent: () => void;
};

export const AutomationsEmptyState = ({
  onRefresh,
  agentsVisible,
  userHasPermissionToWriteAgent,
  isCreatingAgent,
  onCreateAgent,
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
  const branding = flagsHooks.useWebsiteBranding();

  return (
    <>
      <PageSection
        className="mt-0"
        title={t('Get started with {brandName}', {
          brandName: branding.websiteName ?? platform.name,
        })}
      >
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <GetStartedCard
            icon={<Workflow />}
            title={t('Build a Flow')}
            description={t('Create automated workflows')}
          >
            <ActionRow
              icon={<Plus />}
              label={t('Start from scratch')}
              onClick={() => createFlow()}
              disabled={isCreateFlowPending}
              hasPermission={userHasPermissionToWriteFlow}
            />
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToWriteFlow}
            >
              <ImportFlowDialog
                insideBuilder={false}
                onRefresh={onRefresh}
                folderId={UncategorizedFolderId}
              >
                <button
                  disabled={!userHasPermissionToWriteFlow}
                  className={ACTION_ROW_CLASS}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-4 shrink-0 items-center justify-center text-gray-11">
                      <Upload className="size-4" />
                    </span>
                    <span className="truncate text-sm font-medium">
                      {t('Import')}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-gray-11" />
                </button>
              </ImportFlowDialog>
            </PermissionNeededTooltip>
            <ActionRow
              icon={<Sparkles />}
              label={t('Use Templates')}
              onClick={() => {
                if (embedState.isEmbedded) {
                  setIsTemplatesBrowseDialogOpen(true);
                } else {
                  navigate('/templates');
                }
              }}
              hasPermission={userHasPermissionToWriteFlow}
            />
          </GetStartedCard>

          {!embedState.hideTables && (
            <GetStartedCard
              icon={<Table2 />}
              title={t('Create a Table')}
              description={t('Organize and manage data')}
            >
              <ActionRow
                icon={<Plus />}
                label={t('Start from scratch')}
                onClick={() => createTable({ name: t('New Table') })}
                disabled={isCreateTablePending}
                hasPermission={userHasPermissionToWriteTable}
              />
              <ActionRow
                icon={<Upload />}
                label={t('Import')}
                onClick={() => setIsImportTableDialogOpen(true)}
                hasPermission={userHasPermissionToWriteTable}
              />
            </GetStartedCard>
          )}

          {agentsVisible && (
            <GetStartedCard
              icon={<Bot className="h-5 w-5 text-accent-11" />}
              iconBgClass="bg-accent-3"
              title={t('Build an Agent')}
              description={t('Delegate tasks to AI')}
            >
              <ActionRow
                icon={<Plus className="h-4 w-4" />}
                label={t('Start from scratch')}
                onClick={onCreateAgent}
                disabled={isCreatingAgent}
                hasPermission={userHasPermissionToWriteAgent}
              />
            </GetStartedCard>
          )}
        </div>
      </PageSection>

      {(hasTemplates || isLoadingTemplates) && (
        <PageSection
          title={
            <span className="flex items-center gap-2">
              {t('Templates For You')}
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

const ACTION_ROW_CLASS =
  'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-3 disabled:cursor-not-allowed disabled:opacity-50';
