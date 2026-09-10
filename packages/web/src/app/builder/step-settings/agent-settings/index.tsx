import { AIProviderName, isNil, omit } from '@activepieces/core-utils';
import {
  AgentPieceProps,
  AgentProviderModel,
  PieceAction,
  PieceActionSettings,
} from '@activepieces/shared';
import { useFormContext } from 'react-hook-form';

import { AgentLink } from '@/app/builder/step-settings/agent-settings/agent-link';
import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { FormField } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { AIModelSelector, AgentStructuredOutput } from '@/features/agents';

import {
  selectGenericFormComponentForProperty,
  SelectGenericFormComponentForPropertyParams,
} from '../../piece-properties/properties-utils';
import { PieceNotAvailableAlert } from '../piece-not-available-alert';
import { useStepSettingsContext } from '../step-settings-context';

type AgentSettingsProps = {
  step: PieceAction;
  flowId: string;
  readonly: boolean;
};

export const AgentSettings = (props: AgentSettingsProps) => {
  const {
    pieceModel,
    pieceModelNotFound,
    updateFormSchema,
    updatePropertySettingsSchema,
  } = useStepSettingsContext();
  const form = useFormContext();

  if (isNil(pieceModel) && pieceModelNotFound) {
    return (
      <PieceNotAvailableAlert
        pieceName={props.step.settings.pieceName}
        pieceVersion={props.step.settings.pieceVersion}
      />
    );
  }

  if (isNil(pieceModel)) {
    return (
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
    );
  }

  const actionName = (props.step.settings as PieceActionSettings)
    .actionName as string;
  const selectedAction = pieceModel.actions[actionName];
  const linkedAgentId = form.watch(
    `settings.input.${AgentPieceProps.AGENT_ID}`,
  ) as string | undefined;
  const comesFromTheAgent = [
    AgentPieceProps.AGENT_TOOLS,
    AgentPieceProps.STRUCTURED_OUTPUT,
    AgentPieceProps.AI_PROVIDER_MODEL,
    AgentPieceProps.MAX_STEPS,
  ];
  const properties = omit(selectedAction.props, [
    'auth',
    AgentPieceProps.AGENT_ID,
    ...(isNil(linkedAgentId) ? [] : comesFromTheAgent),
  ]);
  const versionCanStoreALink = AgentPieceProps.AGENT_ID in selectedAction.props;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 w-full">
        {versionCanStoreALink && <AgentLink disabled={props.readonly} />}
        {Object.keys(properties).map((propertyName) => {
          return (
            <FormField
              key={propertyName}
              name={`settings.input.${propertyName}`}
              control={form.control}
              render={({ field }) =>
                selectAgentFormComponentForProperty({
                  field,
                  allowDynamicValues: false,
                  dynamicInputModeToggled: false,
                  markdownVariables: {},
                  propertyName: propertyName,
                  inputName: `settings.input.${propertyName}`,
                  property: properties[propertyName],
                  useMentionTextInput: true,
                  disabled: props.readonly,
                  form: form,
                  dynamicPropsInfo: {
                    pieceName: props.step.settings.pieceName,
                    pieceVersion: props.step.settings.pieceVersion,
                    actionOrTriggerName: actionName,
                    placedInside: 'stepSettings',
                    updateFormSchema,
                    updatePropertySettingsSchema,
                  },
                  propertySettings: null,
                })
              }
            />
          );
        })}
      </div>
    </div>
  );
};

type selectFormComponentForPropertyParams =
  SelectGenericFormComponentForPropertyParams;
const selectAgentFormComponentForProperty = (
  params: selectFormComponentForPropertyParams,
) => {
  const { propertyName, disabled, field } = params;

  switch (propertyName) {
    case AgentPieceProps.AGENT_TOOLS: {
      const providerModel = params.form?.watch?.(
        'settings.input.aiProviderModel',
      ) as AgentProviderModel | undefined;
      return (
        <AgentTools
          disabled={disabled}
          toolsField={field}
          selectedProvider={
            providerModel?.provider as AIProviderName | undefined
          }
        />
      );
    }
    case AgentPieceProps.STRUCTURED_OUTPUT: {
      return (
        <AgentStructuredOutput
          disabled={disabled}
          structuredOutputField={field}
        />
      );
    }
    case AgentPieceProps.AI_PROVIDER_MODEL: {
      const providerModel = field.value as AgentProviderModel | undefined;
      const provider = providerModel?.provider;
      const model = providerModel?.model;
      const configId = providerModel?.configId;
      return (
        <AIModelSelector
          defaultModel={model}
          defaultProvider={provider}
          defaultConfigId={configId}
          onChange={field.onChange}
          disabled={disabled}
        />
      );
    }
    default: {
      return selectGenericFormComponentForProperty({
        ...params,
        enableMarkdownForInputWithMention:
          propertyName === AgentPieceProps.PROMPT,
      });
    }
  }
};
