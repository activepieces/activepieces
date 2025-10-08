import React from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { AutoPropertiesFormComponent } from '@/app/builder/piece-properties/auto-properties-form';
import { useStepSettingsContext } from '@/app/builder/step-settings/step-settings-context';
import { FormControl, FormField } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentToolsSettings } from '@/features/agents/agent-tools';
import { AgentStructuredOutput } from '@/features/agents/structured-output';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  PieceProperty,
  ActionBase,
  TriggerBase,
} from '@activepieces/pieces-framework';
import {
  AgentPieceProps,
  ApFlagId,
  PieceAction,
  PieceActionSettings,
} from '@activepieces/shared';

type AgentPieceSettingsProps = {
  step: PieceAction;
  flowId: string;
  readonly: boolean;
};

const removeAuthFromProps = (
  props: Record<string, any>,
): Record<string, any> => {
  const { auth, ...rest } = props;
  return rest;
};

export const AgentPieceSettings = React.memo(
  ({ flowId, readonly, step }: AgentPieceSettingsProps) => {
    const { pieceModel } = useStepSettingsContext();
    const form = useFormContext();

    const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
      ApFlagId.WEBHOOK_URL_PREFIX,
    );

    const { data: pausedFlowTimeoutDays } = flagsHooks.useFlag<number>(
      ApFlagId.PAUSED_FLOW_TIMEOUT_DAYS,
    );

    const { data: webhookTimeoutSeconds } = flagsHooks.useFlag<number>(
      ApFlagId.WEBHOOK_TIMEOUT_SECONDS,
    );

    const { data: frontendUrl } = flagsHooks.useFlag<string>(
      ApFlagId.PUBLIC_URL,
    );
    const markdownVariables = {
      webhookUrl: `${webhookPrefixUrl}/${flowId}`,
      formUrl: `${frontendUrl}forms/${flowId}`,
      chatUrl: `${frontendUrl}chats/${flowId}`,
      pausedFlowTimeoutDays: pausedFlowTimeoutDays?.toString() ?? '',
      webhookTimeoutSeconds: webhookTimeoutSeconds?.toString() ?? '',
    };

    const actionName = (step.settings as PieceActionSettings).actionName;

    const selectedAction = actionName
      ? pieceModel?.actions[actionName]
      : undefined;

    const actionPropsWithoutAuth = removeAuthFromProps(
      selectedAction?.props ?? {},
    );

    return (
      <div className="flex flex-col gap-4 w-full">
        {!pieceModel && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="w-full h-8" />
            ))}
          </div>
        )}
        {pieceModel && Object.keys(actionPropsWithoutAuth).length > 0 && (
          <div className="flex flex-col gap-4 w-full">
            {Object.entries(actionPropsWithoutAuth).map(([propertyName]) => {
              console.log(propertyName);
              return (
                <FormField
                  key={propertyName}
                  name={`settings.input.${propertyName}`}
                  control={form.control}
                  render={({ field }) =>
                    selectFormComponentForProperty({
                      field: {
                        ...field,
                        onChange: (value) => field.onChange(value),
                      },
                      propertyName,
                      inputName: `settings.input.${propertyName}`,
                      property: actionPropsWithoutAuth[propertyName],
                      allowDynamicValues: true,
                      markdownVariables: markdownVariables ?? {},
                      useMentionTextInput: true,
                      disabled: readonly ?? false,
                    })
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    );
  },
);



AgentPieceSettings.displayName = 'AgentPieceSettins';

type selectFormComponentForPropertyParams = {
  field: ControllerRenderProps<Record<string, any>, string>;
  propertyName: string;
  inputName: string;
  selectedStep?: ActionBase | TriggerBase;
  property: PieceProperty;
  allowDynamicValues: boolean;
  markdownVariables: Record<string, string>;
  useMentionTextInput: boolean;
  disabled: boolean;
};

const selectFormComponentForProperty = (
  props: selectFormComponentForPropertyParams,
) => {
  switch (props.propertyName) {
    case AgentPieceProps.AGENT_TOOLS:
      return (
        <AgentToolsSettings field={props.field} />
    );
    case AgentPieceProps.STRUCTURED_OUTPUT:
      return <AgentStructuredOutput field={props.field} />;
    case AgentPieceProps.MAX_STEPS:
      return <h2>Max steps</h2>;
    case AgentPieceProps.MCP_ID:
      return <h2>Mcp id</h2>;
    case AgentPieceProps.PROMPT:
      return <h2>prompt</h2>;
    default:
      return <></>;
  }
};

AutoPropertiesFormComponent.displayName = 'AutoFormComponent';
export { AutoPropertiesFormComponent };
