import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
  Permission,
} from '@activepieces/shared';
import { t } from 'i18next';
import { GlobeIcon, Info } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIconWithPieceName } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

const ReplaceConnectionSelectionFields = ({
  pieces,
  sourceConnections,
  targetConnections,
  loading,
}: ReplaceConnectionSelectionFieldsProps) => {
  const form = useFormContext<ReplaceConnectionSelection>();
  const selectedPiece = useWatch({ control: form.control, name: 'pieceName' });
  const sourceConnectionId = useWatch({
    control: form.control,
    name: 'sourceConnectionId',
  });

  const pieceSourceConnections = sourceConnections.filter(
    (connection) => connection.pieceName === selectedPiece,
  );
  const pieceTargetConnections = targetConnections.filter(
    (connection) =>
      connection.pieceName === selectedPiece &&
      connection.id !== sourceConnectionId,
  );

  return (
    <>
      <FormField
        control={form.control}
        name="pieceName"
        rules={{ required: t('Please select a piece') }}
        render={({ field }) => (
          <div className="flex flex-col gap-2">
            <Label>{t('Piece')}</Label>
            <SearchableSelect
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                form.setValue('sourceConnectionId', '');
                form.setValue('targetConnectionId', '');
              }}
              options={pieces.map((piece) => ({
                label: piece.displayName,
                value: piece.name,
              }))}
              placeholder={t('Select a piece')}
              loading={loading}
              valuesRendering={(value) => {
                const piece = pieces.find(
                  (candidate) => candidate.name === value,
                );
                return (
                  <div className="flex gap-2 items-center">
                    <PieceIconWithPieceName
                      pieceName={piece!.name}
                      size="xs"
                      border={false}
                    />
                    <span>{piece!.displayName}</span>
                  </div>
                );
              }}
            />
            <FormMessage />
          </div>
        )}
      />

      {selectedPiece && (
        <>
          <FormField
            control={form.control}
            name="sourceConnectionId"
            rules={{ required: t('Please select a connection to replace') }}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label>{t('Connection to replace')}</Label>
                <SearchableSelect
                  value={field.value}
                  loading={loading}
                  onChange={(value) => {
                    field.onChange(value ?? '');
                    form.setValue('targetConnectionId', '');
                  }}
                  options={toOptions(pieceSourceConnections)}
                  placeholder={t('Choose connection to replace')}
                  valuesRendering={(value) => (
                    <ConnectionLabel
                      connection={pieceSourceConnections.find(
                        (connection) => connection.id === value,
                      )}
                    />
                  )}
                />
                <FormMessage />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="targetConnectionId"
            rules={{
              required: t('Please select a connection to replace with'),
            }}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label>{t('Replaced With')}</Label>
                <SearchableSelect
                  value={field.value}
                  loading={loading}
                  onChange={(value) => field.onChange(value ?? '')}
                  options={toOptions(pieceTargetConnections)}
                  placeholder={t('Choose connection to replace with')}
                  valuesRendering={(value) => (
                    <ConnectionLabel
                      connection={pieceTargetConnections.find(
                        (connection) => connection.id === value,
                      )}
                    />
                  )}
                />
                <FormMessage />
              </div>
            )}
          />
        </>
      )}
    </>
  );
};

function ConnectionLabel({
  connection,
}: {
  connection: AppConnectionWithoutSensitiveData | undefined;
}) {
  if (!connection) {
    return null;
  }
  return (
    <div className="flex gap-2 items-center">
      <PieceIconWithPieceName
        pieceName={connection.pieceName}
        size="xs"
        border={false}
      />
      {connection.scope === AppConnectionScope.PLATFORM && (
        <GlobeIcon className="w-4 h-4" />
      )}
      <span>{connection.displayName}</span>
    </div>
  );
}

function toOptions(connections: AppConnectionWithoutSensitiveData[]) {
  return connections.map((connection) => ({
    label: connection.displayName,
    value: connection.id,
  }));
}

function ReplaceConnectionVersionsField() {
  const form = useFormContext<{ applyToPublishedVersions: boolean }>();
  const publishNeedsApproval = usePublishNeedsApproval();
  return (
    <FormField
      control={form.control}
      name="applyToPublishedVersions"
      render={({ field }) => (
        <div className="flex flex-col gap-1.5">
          <LabelWithTooltip
            label={t('Which versions to update')}
            tooltip={t(
              'Draft only updates your working copy. Live flows keep using the old connection until you publish them again. Draft and published republishes affected flows now, which can interrupt running automations.',
            )}
          />
          <Select
            value={String(field.value)}
            onValueChange={(value) => field.onChange(value === 'true')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">{t('Draft only')}</SelectItem>
              <SelectItem value="true">{t('Draft and published')}</SelectItem>
            </SelectContent>
          </Select>
          {field.value && publishNeedsApproval && (
            <Alert>
              <Info className="size-4" />
              <AlertDescription>
                {t(
                  'This project needs approval to publish. Each affected flow gets a new publish request, which replaces any request that is already waiting for that flow.',
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    />
  );
}

function usePublishNeedsApproval(): boolean {
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  return (
    platform.plan.environmentsEnabled &&
    !!project.sensitive &&
    !checkAccess(Permission.PUBLISH_SENSITIVE_FLOW_ACCESS)
  );
}

function LabelWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-gray-11 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

ReplaceConnectionSelectionFields.displayName =
  'ReplaceConnectionSelectionFields';
export { ReplaceConnectionSelectionFields, ReplaceConnectionVersionsField };

export const replaceConnectionSelectionHooks = {
  usePublishNeedsApproval,
};

export const replaceConnectionSelectionUtils = {
  emptySelection: (): ReplaceConnectionSelection => ({
    pieceName: '',
    sourceConnectionId: '',
    targetConnectionId: '',
  }),
};

export type ReplaceConnectionSelection = {
  pieceName: string;
  sourceConnectionId: string;
  targetConnectionId: string;
};

type ReplaceConnectionSelectionFieldsProps = {
  pieces: PieceMetadataModelSummary[];
  sourceConnections: AppConnectionWithoutSensitiveData[];
  targetConnections: AppConnectionWithoutSensitiveData[];
  loading: boolean;
};
