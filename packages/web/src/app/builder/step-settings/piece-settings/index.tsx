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
import { cn } from '@/lib/utils';

import { ActionErrorHandlingForm } from '../../piece-properties/action-error-handling';
import { AdvancedSection } from '../../piece-properties/advanced-section';
import { filterPropertyUtils } from '../../piece-properties/filter-property-utils';
import { GenericPropertiesForm } from '../../piece-properties/generic-properties-form';
import { PieceNotAvailableAlert } from '../piece-not-available-alert';
import { useStepSettingsContext } from '../step-settings-context';

import { ConfigNavigator } from './config-navigator';
import { configSectionUtils, type ConfigSection } from './config-sections';
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

  const selectedActionOrTrigger = selectedAction ?? selectedTrigger;
  const split = isNil(selectedAction) ? triggerSplit : actionSplit;
  const showErrorHandling =
    !isNil(selectedAction) && errorHandlingItemsCount > 0;
  const hasConnection =
    !isNil(pieceModel?.auth) && (showAuthForAction || showAuthForTrigger);

  const sections = isNil(selectedActionOrTrigger)
    ? []
    : configSectionUtils.buildSections({
        propertyGroups: selectedActionOrTrigger.propertyGroups,
        essentialProps: split.essential,
        advancedPropNames: Object.keys(split.advanced),
        hasConnection,
        hasErrorHandling: showErrorHandling,
        hasTest: false,
      });

  const allProps = isNil(selectedAction)
    ? triggerPropsWithoutAuth
    : actionPropsWithoutAuth;
  const requiredNamesByKey = Object.fromEntries(
    sections.map((section) => [
      section.key,
      configSectionUtils.requiredNamesOf({ section, props: allProps }),
    ]),
  );

  const usesNavigator = configSectionUtils.usesNavigator({
    propertyGroups: selectedActionOrTrigger?.propertyGroups,
  });

  const dynamicPropsInfo = {
    pieceName: pieceModel?.name ?? '',
    pieceVersion: pieceModel?.version ?? '',
    actionOrTriggerName: selectedActionOrTrigger?.name ?? '',
    placedInside: 'stepSettings' as const,
    updateFormSchema,
    updatePropertySettingsSchema,
  };

  const propsOfSection = (section: ConfigSection) =>
    section.propNames.reduce<Record<string, PieceProperty>>((acc, name) => {
      if (split.essential[name]) {
        acc[name] = split.essential[name];
      }
      return acc;
    }, {});

  const renderSection = (section: ConfigSection) => {
    if (section.kind === 'connection') {
      return isNil(pieceModel) ? null : (
        <ConnectionSelect
          isTrigger={!isNil(selectedTrigger)}
          piece={pieceModel}
          disabled={props.readonly}
          variant="hero"
        ></ConnectionSelect>
      );
    }
    if (section.kind === 'advanced') {
      return (
        <>
          <GenericPropertiesForm
            key={`${selectedActionOrTrigger?.name}-advanced`}
            prefixValue={'settings.input'}
            props={split.advanced}
            propertySettings={selectedStep.settings.propertySettings}
            disabled={props.readonly}
            useMentionTextInput={true}
            markdownVariables={markdownVariables}
            dynamicPropsInfo={dynamicPropsInfo}
          ></GenericPropertiesForm>
          {showErrorHandling && (
            <ActionErrorHandlingForm
              hideContinueOnFailure={hideContinueOnFailure}
              hideRetryOnFailure={hideRetryOnFailure}
              disabled={props.readonly}
            />
          )}
        </>
      );
    }
    return (
      <GenericPropertiesForm
        key={`${selectedActionOrTrigger?.name}-${section.key}`}
        prefixValue={'settings.input'}
        props={propsOfSection(section)}
        propertyGroups={selectedActionOrTrigger?.propertyGroups}
        propertySettings={selectedStep.settings.propertySettings}
        disabled={props.readonly}
        useMentionTextInput={true}
        markdownVariables={markdownVariables}
        dynamicPropsInfo={dynamicPropsInfo}
      ></GenericPropertiesForm>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 w-full',
        usesNavigator && 'min-h-0 flex-1',
      )}
    >
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

      {pieceModel && usesNavigator && (
        <ConfigNavigator
          sections={sections}
          requiredNamesByKey={requiredNamesByKey}
          prefixValue="settings.input"
          renderSection={renderSection}
        />
      )}

      {pieceModel && !usesNavigator && !isNil(selectedActionOrTrigger) && (
        <>
          {hasConnection && (
            <ConnectionSelect
              isTrigger={!isNil(selectedTrigger)}
              piece={pieceModel}
              disabled={props.readonly}
            ></ConnectionSelect>
          )}
          <GenericPropertiesForm
            key={`${selectedActionOrTrigger.name}-essential`}
            prefixValue={'settings.input'}
            props={split.essential}
            propertyGroups={selectedActionOrTrigger.propertyGroups}
            propertySettings={selectedStep.settings.propertySettings}
            disabled={props.readonly}
            useMentionTextInput={true}
            markdownVariables={markdownVariables}
            dynamicPropsInfo={dynamicPropsInfo}
          ></GenericPropertiesForm>
          <AdvancedSection
            count={Object.keys(split.advanced).length}
            watchPaths={Object.keys(split.advanced).map(
              (name) => `settings.input.${name}`,
            )}
          >
            <GenericPropertiesForm
              key={`${selectedActionOrTrigger.name}-advanced`}
              prefixValue={'settings.input'}
              props={split.advanced}
              propertySettings={selectedStep.settings.propertySettings}
              disabled={props.readonly}
              useMentionTextInput={true}
              markdownVariables={markdownVariables}
              dynamicPropsInfo={dynamicPropsInfo}
            ></GenericPropertiesForm>
          </AdvancedSection>
          {showErrorHandling && (
            <ActionErrorHandlingForm
              hideContinueOnFailure={hideContinueOnFailure}
              hideRetryOnFailure={hideRetryOnFailure}
              disabled={props.readonly}
            />
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
