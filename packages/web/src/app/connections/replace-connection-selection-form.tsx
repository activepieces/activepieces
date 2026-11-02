import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { GlobeIcon, Info } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, FormMessage } from '@/components/ui/form';
import { Label, LabelWithTooltip } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { flowApprovalsHooks } from '@/features/flow-approvals';
import { PieceIconWithPieceName } from '@/features/pieces';

const ReplaceConnectionSelectionFields = ({
  source,
  targetConnections,
  loading,
}: ReplaceConnectionSelectionFieldsProps) => {
  const form = useFormContext<ReplaceConnectionSelection>();
  const selectedPieceName = useWatch({
    control: form.control,
    name: 'pieceName',
  });
  const selectedSourceConnectionId = useWatch({
    control: form.control,
    name: 'sourceConnectionId',
  });
  const isSourceFixed = source.kind === ReplaceConnectionSourceKind.FIXED;
  const pieceName = isSourceFixed
    ? source.connection.pieceName
    : selectedPieceName;
  const sourceConnectionId = isSourceFixed
    ? source.connection.id
    : selectedSourceConnectionId;
  const pieceTargetConnections = targetConnections.filter(
    (connection) =>
      connection.pieceName === pieceName &&
      connection.id !== sourceConnectionId,
  );

  return (
    <>
      {source.kind === ReplaceConnectionSourceKind.CHOOSE && (
        <SourceSelectionFields
          pieces={source.pieces}
          connections={source.connections}
          loading={loading}
        />
      )}
      {pieceName && (
        <FormField
          control={form.control}
          name="targetConnectionId"
          rules={{
            required: t('Please select a connection to replace with'),
          }}
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <Label>{t('Replace with')}</Label>
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
      )}
    </>
  );
};

function SourceSelectionFields({
  pieces,
  connections,
  loading,
}: SourceSelectionFieldsProps) {
  const form = useFormContext<ReplaceConnectionSelection>();
  const selectedPieceName = useWatch({
    control: form.control,
    name: 'pieceName',
  });
  const pieceConnections = connections.filter(
    (connection) => connection.pieceName === selectedPieceName,
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
      {selectedPieceName && (
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
                options={toOptions(pieceConnections)}
                placeholder={t('Choose connection to replace')}
                valuesRendering={(value) => (
                  <ConnectionLabel
                    connection={pieceConnections.find(
                      (connection) => connection.id === value,
                    )}
                  />
                )}
              />
              <FormMessage />
            </div>
          )}
        />
      )}
    </>
  );
}

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

function ReplaceConnectionFlowVersionsField() {
  const form = useFormContext<ReplaceConnectionFlowVersionsSelection>();
  const publishNeedsApproval = flowApprovalsHooks.usePublishNeedsApproval();
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

function ReplaceConnectionTestFlowsAlert({
  sourceConnection,
  targetConnections,
  flowCount,
}: ReplaceConnectionTestFlowsAlertProps) {
  const form = useFormContext<ReplaceConnectionSelection>();
  const targetConnectionId = useWatch({
    control: form.control,
    name: 'targetConnectionId',
  });
  const targetConnection = targetConnections.find(
    (connection) => connection.id === targetConnectionId,
  );
  if (!targetConnection || !sourceConnection) {
    return null;
  }
  const names: Record<string, string> = {
    [NEW_NAME_PLACEHOLDER]: targetConnection.displayName,
    [OLD_NAME_PLACEHOLDER]: sourceConnection.displayName,
  };
  const parts = t(
    "{flowCount, plural, =1 {We recommend testing the flow after the replace. If {newName} can't access the same data as {oldName}, the flow could break.} other {We recommend testing these flows after the replace. If {newName} can't access the same data as {oldName}, they could break.}}",
    {
      flowCount,
      newName: NEW_NAME_PLACEHOLDER,
      oldName: OLD_NAME_PLACEHOLDER,
    },
  ).split(NAME_PLACEHOLDER_PATTERN);
  return (
    <Alert>
      <Info className="size-4" />
      <AlertDescription>
        <span>
          {parts.map((part, index) =>
            part in names ? (
              <strong key={index} className="font-semibold">
                {names[part]}
              </strong>
            ) : (
              part
            ),
          )}
        </span>
      </AlertDescription>
    </Alert>
  );
}

ReplaceConnectionSelectionFields.displayName =
  'ReplaceConnectionSelectionFields';
export {
  ReplaceConnectionSelectionFields,
  ReplaceConnectionFlowVersionsField,
  ReplaceConnectionTestFlowsAlert,
};

const NEW_NAME_PLACEHOLDER = '__AP_NEW_CONNECTION_NAME__';
const OLD_NAME_PLACEHOLDER = '__AP_OLD_CONNECTION_NAME__';
const NAME_PLACEHOLDER_PATTERN =
  /(__AP_NEW_CONNECTION_NAME__|__AP_OLD_CONNECTION_NAME__)/;

export const replaceConnectionSelectionUtils = {
  emptySelection: (): ReplaceConnectionSelection => ({
    pieceName: '',
    sourceConnectionId: '',
    targetConnectionId: '',
  }),
};

export enum ReplaceConnectionSourceKind {
  CHOOSE = 'CHOOSE',
  FIXED = 'FIXED',
}

export type ReplaceConnectionSelection = {
  pieceName: string;
  sourceConnectionId: string;
  targetConnectionId: string;
};

export type ReplaceConnectionFlowVersionsSelection = {
  applyToPublishedVersions: boolean;
};

type ReplaceConnectionSource =
  | {
      kind: ReplaceConnectionSourceKind.CHOOSE;
      pieces: PieceMetadataModelSummary[];
      connections: AppConnectionWithoutSensitiveData[];
    }
  | {
      kind: ReplaceConnectionSourceKind.FIXED;
      connection: AppConnectionWithoutSensitiveData;
    };

type ReplaceConnectionSelectionFieldsProps = {
  source: ReplaceConnectionSource;
  targetConnections: AppConnectionWithoutSensitiveData[];
  loading: boolean;
};

type ReplaceConnectionTestFlowsAlertProps = {
  sourceConnection: AppConnectionWithoutSensitiveData | undefined;
  targetConnections: AppConnectionWithoutSensitiveData[];
  flowCount: number;
};

type SourceSelectionFieldsProps = {
  pieces: PieceMetadataModelSummary[];
  connections: AppConnectionWithoutSensitiveData[];
  loading: boolean;
};
