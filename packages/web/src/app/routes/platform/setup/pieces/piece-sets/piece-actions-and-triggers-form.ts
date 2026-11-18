import { PieceSet, UpdatePieceSetRequestBody } from '@activepieces/shared';
import { z } from 'zod';

function buildDefaultValues({
  pieceSet,
  pieceName,
  actionNames,
  triggerNames,
}: {
  pieceSet: PieceSet;
  pieceName: string;
  actionNames: string[];
  triggerNames: string[];
}): PieceActionsAndTriggersFormValues {
  const { selectedActions, selectedTriggers } = pieceSet.config;
  const mode: IncludeMode =
    pieceName in selectedActions || pieceName in selectedTriggers
      ? 'selected'
      : 'all';
  return {
    mode,
    selectedActions: pickSelected({
      mode,
      allNames: actionNames,
      savedNames: selectedActions[pieceName],
    }),
    selectedTriggers: pickSelected({
      mode,
      allNames: triggerNames,
      savedNames: selectedTriggers[pieceName],
    }),
  };
}

function toUpdateRequest({
  values,
  pieceName,
}: {
  values: PieceActionsAndTriggersFormValues;
  pieceName: string;
}): UpdatePieceSetRequestBody {
  if (values.mode === 'all') {
    return {
      actions: { [pieceName]: { mode: 'all' } },
      triggers: { [pieceName]: { mode: 'all' } },
    };
  }
  return {
    actions: {
      [pieceName]: { mode: 'selected', selected: values.selectedActions },
    },
    triggers: {
      [pieceName]: { mode: 'selected', selected: values.selectedTriggers },
    },
  };
}

function toggleName({
  checkedNames,
  allNames,
  name,
}: {
  checkedNames: string[];
  allNames: string[];
  name: string;
}): string[] {
  return allNames.filter((existingName) =>
    existingName === name
      ? !checkedNames.includes(existingName)
      : checkedNames.includes(existingName),
  );
}

function pickSelected({
  mode,
  allNames,
  savedNames,
}: {
  mode: IncludeMode;
  allNames: string[];
  savedNames: string[] | undefined;
}): string[] {
  if (mode === 'all' || savedNames === undefined) {
    return allNames;
  }
  return allNames.filter((name) => savedNames.includes(name));
}

const IncludeMode = z.enum(['all', 'selected']);

export const PieceActionsAndTriggersFormSchema = z.object({
  mode: IncludeMode,
  selectedActions: z.array(z.string()),
  selectedTriggers: z.array(z.string()),
});

export const pieceActionsAndTriggersForm = {
  buildDefaultValues,
  toUpdateRequest,
  toggleName,
};

export type IncludeMode = z.infer<typeof IncludeMode>;

export type PieceActionsAndTriggersFormValues = z.infer<
  typeof PieceActionsAndTriggersFormSchema
>;
