import { isNil } from '@activepieces/core-utils';
import {
  PieceProperty,
  PiecePropertyMap,
  PropertyGroup,
} from '@activepieces/pieces-framework';
import {
  ApFlagId,
  PieceAction,
  PieceActionSettings,
  PieceTrigger,
  PieceTriggerSettings,
} from '@activepieces/shared';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { flagsHooks } from '@/hooks/flags-hooks';

import { ActionErrorHandlingForm } from '../../piece-properties/action-error-handling';
import { AdvancedSection } from '../../piece-properties/advanced-section';
import { filterPropertyUtils } from '../../piece-properties/filter-property-utils';
import { GenericPropertiesForm } from '../../piece-properties/generic-properties-form';
import { PieceNotAvailableAlert } from '../piece-not-available-alert';
import { useStepSettingsContext } from '../step-settings-context';

import { ConnectionSelect } from './connection-select';

const PieceSettings = React.memo((props: PieceSettingsProps) => {
  const {
    pieceModel,
    pieceModelNotFound,
    selectedStep,
    updateFormSchema,
    updatePropertySettingsSchema,
  } = useStepSettingsContext();

  const actionName = (props.step.settings as PieceActionSettings).actionName;
  const selectedAction = actionName
    ? pieceModel?.actions[actionName]
    : undefined;
  const triggerName = (props.step.settings as PieceTriggerSettings).triggerName;
  const selectedTrigger = triggerName
    ? pieceModel?.triggers[triggerName]
    : undefined;

  const actionPropsWithoutAuth = removeAuthFromProps(
    selectedAction?.props ?? {},
  );
  const triggerPropsWithoutAuth = removeAuthFromProps(
    selectedTrigger?.props ?? {},
  );

  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );

  const { data: pausedFlowTimeoutDays } = flagsHooks.useFlag<number>(
    ApFlagId.PAUSED_FLOW_TIMEOUT_DAYS,
  );

  const { data: webhookTimeoutSeconds } = flagsHooks.useFlag<number>(
    ApFlagId.WEBHOOK_TIMEOUT_SECONDS,
  );

  const { data: frontendUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const markdownVariables = {
    webhookUrl: `${webhookPrefixUrl}/${props.flowId}`,
    formUrl: `${frontendUrl}forms/${props.flowId}`,
    chatUrl: `${frontendUrl}chats/${props.flowId}`,
    pausedFlowTimeoutDays: pausedFlowTimeoutDays?.toString() ?? '',
    webhookTimeoutSeconds: webhookTimeoutSeconds?.toString() ?? '',
  };

  const showAuthForAction =
    !isNil(selectedAction) && (selectedAction.requireAuth ?? true);
  const showAuthForTrigger =
    !isNil(selectedTrigger) && (selectedTrigger.requireAuth ?? true);

  if (!pieceModel && pieceModelNotFound) {
    return (
      <PieceNotAvailableAlert
        pieceName={props.step.settings.pieceName}
        pieceVersion={props.step.settings.pieceVersion}
      />
    );
  }

  const actionForcedEssentialNames = collectForcedEssentialNames(
    selectedAction?.propertyGroups,
    actionPropsWithoutAuth,
  );
  const triggerForcedEssentialNames = collectForcedEssentialNames(
    selectedTrigger?.propertyGroups,
    triggerPropsWithoutAuth,
  );

  const actionSplit = splitProps({
    props: actionPropsWithoutAuth,
    forcedEssentialNames: actionForcedEssentialNames,
    isFilterBuilder: hasFilterBuilderLayout(selectedAction?.propertyGroups),
  });
  const triggerSplit = splitProps({
    props: triggerPropsWithoutAuth,
    forcedEssentialNames: triggerForcedEssentialNames,
    isFilterBuilder: hasFilterBuilderLayout(selectedTrigger?.propertyGroups),
  });

  const hideContinueOnFailure =
    selectedAction?.errorHandlingOptions?.continueOnFailure?.hide ?? false;
  const hideRetryOnFailure =
    selectedAction?.errorHandlingOptions?.retryOnFailure?.hide ?? false;
  const errorHandlingItemsCount =
    selectedAction !== undefined
      ? (hideContinueOnFailure ? 0 : 1) + (hideRetryOnFailure ? 0 : 1)
      : 0;

  const actionAdvancedCount = Object.keys(actionSplit.advanced).length;
  const triggerAdvancedCount = Object.keys(triggerSplit.advanced).length;

  const actionAdvancedWatchPaths = Object.keys(actionSplit.advanced).map(
    (name) => `settings.input.${name}`,
  );
  const triggerAdvancedWatchPaths = Object.keys(triggerSplit.advanced).map(
    (name) => `settings.input.${name}`,
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {!pieceModel && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="space-y-2" key={index}>
              <div className="flex justify-between items-center">
                <Skeleton className="w-40 h-4" />
                <Skeleton className="size-8" />
              </div>
              <Skeleton className="w-full h-12" />
            </div>
          ))}
        </div>
      )}

      {pieceModel && (
        <>
          {pieceModel.auth && (showAuthForAction || showAuthForTrigger) && (
            <ConnectionSelect
              isTrigger={!isNil(selectedTrigger)}
              piece={pieceModel}
              disabled={props.readonly}
            ></ConnectionSelect>
          )}
          {selectedAction && (
            <>
              <GenericPropertiesForm
                key={`${selectedAction.name}-essential`}
                prefixValue={'settings.input'}
                props={actionSplit.essential}
                propertyGroups={selectedAction.propertyGroups}
                propertySettings={selectedStep.settings.propertySettings}
                disabled={props.readonly}
                useMentionTextInput={true}
                markdownVariables={markdownVariables}
                dynamicPropsInfo={{
                  pieceName: pieceModel.name,
                  pieceVersion: pieceModel.version,
                  actionOrTriggerName: selectedAction.name,
                  placedInside: 'stepSettings',
                  updateFormSchema,
                  updatePropertySettingsSchema,
                }}
              ></GenericPropertiesForm>
              <AdvancedSection
                count={actionAdvancedCount}
                watchPaths={actionAdvancedWatchPaths}
              >
                <GenericPropertiesForm
                  key={`${selectedAction.name}-advanced`}
                  prefixValue={'settings.input'}
                  props={actionSplit.advanced}
                  propertySettings={selectedStep.settings.propertySettings}
                  disabled={props.readonly}
                  useMentionTextInput={true}
                  markdownVariables={markdownVariables}
                  dynamicPropsInfo={{
                    pieceName: pieceModel.name,
                    pieceVersion: pieceModel.version,
                    actionOrTriggerName: selectedAction.name,
                    placedInside: 'stepSettings',
                    updateFormSchema,
                    updatePropertySettingsSchema,
                  }}
                ></GenericPropertiesForm>
              </AdvancedSection>
              {errorHandlingItemsCount > 0 && (
                <ActionErrorHandlingForm
                  hideContinueOnFailure={hideContinueOnFailure}
                  hideRetryOnFailure={hideRetryOnFailure}
                  disabled={props.readonly}
                />
              )}
            </>
          )}
          {selectedTrigger && (
            <>
              <GenericPropertiesForm
                key={`${selectedTrigger.name}-essential`}
                prefixValue={'settings.input'}
                props={triggerSplit.essential}
                propertyGroups={selectedTrigger.propertyGroups}
                useMentionTextInput={true}
                propertySettings={selectedStep.settings.propertySettings}
                disabled={props.readonly}
                markdownVariables={markdownVariables}
                dynamicPropsInfo={{
                  pieceName: pieceModel.name,
                  pieceVersion: pieceModel.version,
                  actionOrTriggerName: selectedTrigger.name,
                  placedInside: 'stepSettings',
                  updateFormSchema,
                  updatePropertySettingsSchema,
                }}
              ></GenericPropertiesForm>
              <AdvancedSection
                count={triggerAdvancedCount}
                watchPaths={triggerAdvancedWatchPaths}
              >
                <GenericPropertiesForm
                  key={`${selectedTrigger.name}-advanced`}
                  prefixValue={'settings.input'}
                  props={triggerSplit.advanced}
                  useMentionTextInput={true}
                  propertySettings={selectedStep.settings.propertySettings}
                  disabled={props.readonly}
                  markdownVariables={markdownVariables}
                  dynamicPropsInfo={{
                    pieceName: pieceModel.name,
                    pieceVersion: pieceModel.version,
                    actionOrTriggerName: selectedTrigger.name,
                    placedInside: 'stepSettings',
                    updateFormSchema,
                    updatePropertySettingsSchema,
                  }}
                ></GenericPropertiesForm>
              </AdvancedSection>
            </>
          )}
        </>
      )}
    </div>
  );
});

PieceSettings.displayName = 'PieceSettings';
export { PieceSettings };

function removeAuthFromProps(
  props: Record<string, PieceProperty>,
): Record<string, PieceProperty> {
  const { auth: _, ...rest } = props;
  return rest;
}

function isAdvancedProp(property: PieceProperty): boolean {
  if ('advanced' in property && property.advanced !== undefined) {
    return property.advanced;
  }
  return false;
}

function hasSectionLayout(
  propertyGroups: PropertyGroup[] | undefined,
): boolean {
  return (propertyGroups ?? []).some(
    (group) => group.display === 'section' || group.display === 'summary',
  );
}

function hasFilterBuilderLayout(
  propertyGroups: PropertyGroup[] | undefined,
): boolean {
  return (propertyGroups ?? []).some(
    (group) => group.display === 'builder' || group.display === 'footer',
  );
}

/**
 * Props that must stay in the essential form regardless of their required flag:
 * members of tabbed/sectioned groups, plus checkbox reveal targets in a section
 * layout (they render inline within their toggle card, never in Advanced).
 */
function collectForcedEssentialNames(
  propertyGroups: PropertyGroup[] | undefined,
  props: PiecePropertyMap,
): Set<string> {
  const names = new Set<string>();
  (propertyGroups ?? [])
    .filter((group) => group.display === 'tabs' || group.display === 'section')
    .forEach((group) => group.props.forEach((name) => names.add(name)));
  if (hasSectionLayout(propertyGroups)) {
    filterPropertyUtils
      .collectRevealedNames(props)
      .forEach((name) => names.add(name));
  }
  return names;
}

function splitProps({
  props,
  forcedEssentialNames,
  isFilterBuilder,
}: {
  props: PiecePropertyMap;
  forcedEssentialNames: Set<string>;
  isFilterBuilder: boolean;
}): {
  essential: PiecePropertyMap;
  advanced: PiecePropertyMap;
} {
  if (isFilterBuilder) {
    return { essential: props, advanced: {} as PiecePropertyMap };
  }
  const essential: Record<string, PieceProperty> = {};
  const advanced: Record<string, PieceProperty> = {};
  for (const [name, property] of Object.entries(props)) {
    if (!forcedEssentialNames.has(name) && isAdvancedProp(property)) {
      advanced[name] = property;
    } else {
      essential[name] = property;
    }
  }
  return {
    essential: essential as PiecePropertyMap,
    advanced: advanced as PiecePropertyMap,
  };
}

type PieceSettingsProps = {
  step: PieceAction | PieceTrigger;
  flowId: string;
  readonly: boolean;
};
