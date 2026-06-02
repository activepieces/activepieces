import { PieceMetadataModel } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { StepPropertySnapshot } from './explanation-prompt';

type BuildStepPropertiesSnapshotParams = {
  pieceModel: PieceMetadataModel | undefined;
  stepKind: 'action' | 'trigger';
  stepName: string | undefined;
  input: Record<string, unknown> | undefined;
};

const MAX_PROPERTIES = 25;

const toSnapshot = ({
  pieceModel,
  stepKind,
  stepName,
  input,
}: BuildStepPropertiesSnapshotParams): StepPropertySnapshot[] => {
  if (isNil(pieceModel) || isNil(stepName)) {
    return [];
  }
  const stepDefinition =
    stepKind === 'trigger'
      ? pieceModel.triggers?.[stepName]
      : pieceModel.actions?.[stepName];
  if (isNil(stepDefinition) || isNil(stepDefinition.props)) {
    return [];
  }
  const properties = Object.entries(stepDefinition.props).slice(
    0,
    MAX_PROPERTIES,
  );
  return properties.map(([name, prop]) => {
    const currentValue = input?.[name];
    return {
      name,
      displayName: prop.displayName,
      description: prop.description,
      type: prop.type,
      required: prop.required,
      defaultValue: prop.defaultValue,
      currentValue,
    };
  });
};

const findStepDescription = ({
  pieceModel,
  stepKind,
  stepName,
}: {
  pieceModel: PieceMetadataModel | undefined;
  stepKind: 'action' | 'trigger';
  stepName: string | undefined;
}): string | undefined => {
  if (isNil(pieceModel) || isNil(stepName)) {
    return undefined;
  }
  const definition =
    stepKind === 'trigger'
      ? pieceModel.triggers?.[stepName]
      : pieceModel.actions?.[stepName];
  return definition?.description;
};

const findPieceAuthType = (
  pieceModel: PieceMetadataModel | undefined,
): string | undefined => {
  if (isNil(pieceModel) || isNil(pieceModel.auth)) {
    return undefined;
  }
  const auth = Array.isArray(pieceModel.auth)
    ? pieceModel.auth[0]
    : pieceModel.auth;
  return auth?.type;
};

export const stepPropertiesSnapshotUtils = {
  build: toSnapshot,
  findDescription: findStepDescription,
  findAuthType: findPieceAuthType,
};
