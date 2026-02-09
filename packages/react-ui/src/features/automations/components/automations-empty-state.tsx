import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronRight,
  Import,
  Plus,
  Sparkles,
  Table2,
  Upload,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TagWithBright } from '@/components/ui/tag-with-bright';
import {
  flowsCollection,
  tablesCollection,
} from '@/features/automations/lib/automations-collection';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { ImportTableDialog } from '@/features/tables/components/import-table-dialog';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { templatesHooks } from '@/features/templates/hooks/templates-hook';
import { useGradientFromPieces } from '@/features/templates/hooks/use-gradient-from-pieces';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { NEW_FLOW_QUERY_PARAM, NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import {
  FieldType,
  Permission,
  Template,
  TemplateType,
  UncategorizedFolderId,
} from '@activepieces/shared';

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
      className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t first:border-t-0"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
  iconBgClass: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

const GetStartedCard = ({
  icon,
  iconBgClass,
  title,
  description,
  children,
}: GetStartedCardProps) => {
  return (
    <Card className="flex-1 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 px-4 py-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-col">{children}</div>
      </CardContent>
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
  const gradient = useGradientFromPieces(
    hasFlows ? template.flows![0]?.trigger : undefined,
  );

  const displayTags = template.tags.slice(0, 1);

  return (
    <Card
      onClick={() => onSelect(template)}
      variant="interactive"
      className="h-[220px] flex flex-col"
    >
      <CardContent className="py-4 px-4 flex flex-col gap-1 flex-1 min-h-0">
        <div className="h-12 flex flex-col justify-start flex-shrink-0">
          <h3 className="font-semibold text-base leading-tight line-clamp-2">
            {template.name}
          </h3>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-2 mt-1 flex-shrink-0">
          {template.summary || (
            <span className="italic">{t('No summary')}</span>
          )}
        </p>

        <div className="h-8 flex gap-2 flex-wrap overflow-hidden mt-2 flex-shrink-0">
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
        className="h-14 flex items-center px-4 rounded-b-lg transition-all duration-300"
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
            circle={false}
            background="white"
            excludeCore={true}
          />
        )}
      </div>
    </Card>
  );
};

const TemplateCardSkeleton = () => {
  return (
    <Card className="h-[220px] flex flex-col">
      <CardContent className="py-4 px-4 flex flex-col gap-2 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-24 mt-2" />
      </CardContent>
      <div className="h-14 bg-muted/30 rounded-b-lg" />
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
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] = useState(false);
  const projectId = authenticationSession.getProjectId()!;

  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToWriteTable = checkAccess(Permission.WRITE_TABLE);

  const { platform } = platformHooks.useCurrentPlatform();
  const isShowingOfficialTemplates = !platform.plan.manageTemplatesEnabled;

  const { templates, isLoading: isLoadingTemplates } =
    templatesHooks.useTemplates(
      isShowingOfficialTemplates ? TemplateType.OFFICIAL : TemplateType.CUSTOM,
    );

  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId,
        displayName: t('Untitled'),
      });
      return flow;
    },
    onSuccess: (flow) => {
      flowsCollection.utils.writeInsert(flow);
      navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`);
    },
  });

  const { mutate: createTable, isPending: isCreateTablePending } = useMutation({
    mutationFn: async (data: { name: string }) => {
      const table = await tablesApi.create({
        projectId,
        name: data.name,
      });

      const field = await fieldsApi.create({
        name: 'Name',
        type: FieldType.TEXT,
        tableId: table.id,
      });

      await recordsApi.create({
        records: [
          [
            {
              fieldId: field.id,
              value: '',
            },
          ],
        ],
        tableId: table.id,
      });

      return table;
    },
    onSuccess: (table) => {
      tablesCollection.utils.writeInsert(table);
      navigate(
        `/projects/${projectId}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
      );
    },
  });

  const handleTemplateSelect = (template: Template) => {
    navigate(`/templates/${template.id}`);
  };

  const handleViewAllTemplates = () => {
    navigate('/templates');
  };

  const topTemplates = templates?.slice(0, 3) || [];
  const hasTemplates = topTemplates.length > 0;

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-5xl mx-auto">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          {t('Get started with Activepieces')}
        </h2>
        <div className="flex gap-4">
          <GetStartedCard
            icon={<Workflow className="h-5 w-5 text-purple-600" />}
            iconBgClass="bg-purple-100"
            title={t('Build a Flow')}
            description={t('Create automated workflows')}
          >
            <ActionRow
              icon={<Plus className="h-4 w-4" />}
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
                  className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      <Upload className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium">{t('Import')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </ImportFlowDialog>
            </PermissionNeededTooltip>
            <ActionRow
              icon={<Sparkles className="h-4 w-4" />}
              label={t('Use Templates')}
              onClick={handleViewAllTemplates}
              hasPermission={userHasPermissionToWriteFlow}
            />
          </GetStartedCard>

          <GetStartedCard
            icon={<Table2 className="h-5 w-5 text-emerald-600" />}
            iconBgClass="bg-emerald-100"
            title={t('Create a Table')}
            description={t('Organize and manage data')}
          >
            <ActionRow
              icon={<Plus className="h-4 w-4" />}
              label={t('Start from scratch')}
              onClick={() => createTable({ name: t('New Table') })}
              disabled={isCreateTablePending}
              hasPermission={userHasPermissionToWriteTable}
            />
            <ActionRow
              icon={<Import className="h-4 w-4" />}
              label={t('Import')}
              onClick={() => setIsImportTableDialogOpen(true)}
              hasPermission={userHasPermissionToWriteTable}
            />
          </GetStartedCard>
        </div>
      </div>

      {(hasTemplates || isLoadingTemplates) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {t('Templates For You')}
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </h2>
            <button
              onClick={handleViewAllTemplates}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {t('All templates')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      )}

      <ImportTableDialog
        open={isImportTableDialogOpen}
        setIsOpen={setIsImportTableDialogOpen}
        showTrigger={false}
      />
    </div>
  );
};
