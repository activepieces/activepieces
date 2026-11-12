import {
  connectionTemplate,
  isEmpty,
  isNil,
  isObject,
} from '@activepieces/core-utils';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  ConnectionReplaceSource,
  ConnectionSwitchChoice,
  PieceAction,
  PieceTrigger,
  PropertyExecutionType,
  PropertySettings,
  TelemetryEventName,
} from '@activepieces/shared';
import i18next, { t } from 'i18next';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { ReplaceConnectionForFlowDialog } from '@/app/builder/builder-header/replace-connection-for-flow-dialog';
import { ConnectionSelect } from '@/app/connections/connection-select';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  appConnectionsHooks,
  appConnectionsQueries,
} from '@/features/connections';
import { authenticationSession } from '@/lib/authentication-session';

export function ConnectionSelectWithSwitchConfirmation({
  piece,
  stepProps,
  value,
  onChange,
  disabled,
}: ConnectionSelectWithSwitchConfirmationProps) {
  const form = useFormContext<PieceAction | PieceTrigger>();
  const { capture } = useTelemetry();
  const projectId = authenticationSession.getProjectId()!;
  const { data: pieceConnections } = appConnectionsQueries.useAppConnections({
    request: { pieceName: [piece.name], projectId, limit: 1000 },
    pieceAuth: piece.auth,
    extraKeys: [piece.name, projectId],
    staleTime: 0,
  });
  const { showReplace, hasPermissionToReplace } =
    appConnectionsHooks.useReplaceConnectionAccess();
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(
    null,
  );
  const [connectionsToReplace, setConnectionsToReplace] =
    useState<ConnectionsToReplace | null>(null);

  const findConnection = (connectionValue: string | undefined) =>
    pieceConnections?.data.find(
      (connection) =>
        connection.externalId ===
        connectionTemplate.unwrapExternalId(connectionValue),
    );

  const handleChange = (newValue: string) => {
    const currentExternalId = connectionTemplate.unwrapExternalId(value);
    const isSwitch =
      !isNil(currentExternalId) &&
      currentExternalId !== connectionTemplate.unwrapExternalId(newValue);
    if (!isSwitch) {
      onChange(newValue);
      return;
    }
    const { settings } = form.getValues();
    const clearedInputs = listInputsClearedBySwitch({
      props: stepProps,
      input: settings.input,
      propertySettings: settings.propertySettings,
    });
    if (clearedInputs.length === 0) {
      onChange(newValue);
      return;
    }
    setPendingSwitch({ newValue, clearedInputs });
  };

  const sourceConnection = findConnection(value);
  const targetConnection = pendingSwitch
    ? findConnection(pendingSwitch.newValue)
    : undefined;
  const canReplace =
    showReplace && hasPermissionToReplace && !isNil(sourceConnection);

  const captureSwitchDecision = (choice: ConnectionSwitchChoice) =>
    capture({
      name: TelemetryEventName.CONNECTION_SWITCH_DECIDED,
      payload: {
        choice,
        pieceName: piece.name,
        clearedInputCount: pendingSwitch?.clearedInputs.length ?? 0,
        replaceAvailable: canReplace,
      },
    });

  return (
    <>
      <ConnectionSelect
        piece={piece}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      {pendingSwitch && (
        <SwitchConnectionConfirmationDialog
          newConnectionDisplayName={targetConnection?.displayName ?? ''}
          clearedInputs={pendingSwitch.clearedInputs}
          onReplace={
            canReplace && sourceConnection
              ? () => {
                  captureSwitchDecision(ConnectionSwitchChoice.REPLACE);
                  capture({
                    name: TelemetryEventName.CONNECTION_REPLACE_OPENED,
                    payload: {
                      source: ConnectionReplaceSource.SWITCH_DIALOG,
                      pieceName: sourceConnection.pieceName,
                    },
                  });
                  setPendingSwitch(null);
                  setConnectionsToReplace({
                    source: sourceConnection,
                    target: targetConnection,
                  });
                }
              : undefined
          }
          onCancel={() => {
            captureSwitchDecision(ConnectionSwitchChoice.CANCEL);
            setPendingSwitch(null);
          }}
          onConfirm={() => {
            captureSwitchDecision(ConnectionSwitchChoice.SWITCH);
            setPendingSwitch(null);
            onChange(pendingSwitch.newValue);
          }}
        />
      )}
      {connectionsToReplace && (
        <ReplaceConnectionForFlowDialog
          sourceConnection={connectionsToReplace.source}
          targetConnection={connectionsToReplace.target}
          source={ConnectionReplaceSource.SWITCH_DIALOG}
          open
          onOpenChange={(open) => {
            if (!open) {
              setConnectionsToReplace(null);
            }
          }}
        />
      )}
    </>
  );
}

function SwitchConnectionConfirmationDialog({
  newConnectionDisplayName,
  clearedInputs,
  onReplace,
  onCancel,
  onConfirm,
}: SwitchConnectionConfirmationDialogProps) {
  const [beforeInputs, afterInputs] = t(
    "Switching can clear {inputs} in this step's settings, if the {newConnectionDisplayName} connection doesn't have access to them.",
    { inputs: INPUTS_PLACEHOLDER, newConnectionDisplayName },
  ).split(INPUTS_PLACEHOLDER);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('Switch to {newConnectionDisplayName}?', {
              newConnectionDisplayName,
            })}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-gray-12">
          {beforeInputs}
          <InputNames names={clearedInputs.map((input) => input.displayName)} />
          {afterInputs}
        </DialogDescription>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          {onReplace && (
            <Button type="button" variant="outline" onClick={onReplace}>
              {t('Replace in all steps')}
            </Button>
          )}
          <Button type="button" onClick={onConfirm}>
            {t('Switch')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InputNames({ names }: { names: string[] }) {
  const parts = new Intl.ListFormat(i18next.language, {
    type: 'conjunction',
  }).formatToParts(names);
  return parts.map((part, index) =>
    part.type === 'element' ? (
      <strong key={index} className="font-semibold text-gray-12">
        {part.value}
      </strong>
    ) : (
      part.value
    ),
  );
}

function listInputsClearedBySwitch({
  props,
  input,
  propertySettings,
}: ListInputsClearedBySwitchParams): ClearedInput[] {
  return Object.entries(props).flatMap(([propertyName, property]) => {
    if (
      propertySettings[propertyName]?.type === PropertyExecutionType.DYNAMIC
    ) {
      return [];
    }
    switch (property.type) {
      case PropertyType.DROPDOWN:
      case PropertyType.MULTI_SELECT_DROPDOWN:
        return !isEmpty(input[propertyName])
          ? [
              {
                path: propertyName,
                displayName: property.displayName,
              },
            ]
          : [];
      case PropertyType.DYNAMIC:
        return listDynamicChildrenWithValues({
          propertyName,
          propertyDisplayName: property.displayName,
          schema: propertySettings[propertyName]?.schema,
          value: input[propertyName],
        });
      default:
        return [];
    }
  });
}

function listDynamicChildrenWithValues({
  propertyName,
  propertyDisplayName,
  schema,
  value,
}: {
  propertyName: string;
  propertyDisplayName: string;
  schema: unknown;
  value: unknown;
}): ClearedInput[] {
  if (!isObject(value)) {
    return [];
  }
  if (!isObject(schema)) {
    return Object.values(value).some((childValue) => !isEmpty(childValue))
      ? [{ path: propertyName, displayName: propertyDisplayName }]
      : [];
  }
  return Object.entries(schema).flatMap(([childName, child]) =>
    !isEmpty(value[childName]) &&
    isObject(child) &&
    typeof child.displayName === 'string'
      ? [
          {
            path: `${propertyName}.${childName}`,
            displayName: child.displayName,
          },
        ]
      : [],
  );
}

const INPUTS_PLACEHOLDER = '\u0000inputs\u0000';

type ConnectionSelectWithSwitchConfirmationProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  stepProps: PiecePropertyMap;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
};

type PendingSwitch = {
  newValue: string;
  clearedInputs: ClearedInput[];
};

type ConnectionsToReplace = {
  source: AppConnectionWithoutSensitiveData;
  target: AppConnectionWithoutSensitiveData | undefined;
};

type SwitchConnectionConfirmationDialogProps = {
  newConnectionDisplayName: string;
  clearedInputs: ClearedInput[];
  onReplace: (() => void) | undefined;
  onCancel: () => void;
  onConfirm: () => void;
};

type ClearedInput = {
  path: string;
  displayName: string;
};

type ListInputsClearedBySwitchParams = {
  props: PiecePropertyMap;
  input: Record<string, unknown>;
  propertySettings: Record<string, PropertySettings>;
};
