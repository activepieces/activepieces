import { useFormContext } from 'react-hook-form';

import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { FormField } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentStructuredOutput } from '@/features/agents/structured-output';
import {
  AgentPieceProps,
  isNil,
  PieceAction,
  PieceActionSettings,
} from '@activepieces/shared';

import {
  selectGenericFormComponentForProperty,
  SelectGenericFormComponentForPropertyParams,
} from '../../piece-properties/properties-utils';
import { useStepSettingsContext } from '../step-settings-context';

type AgentSettingsProps = {
  step: PieceAction;
  flowId: string;
  readonly: boolean;
};

export const AgentSettings = (props: AgentSettingsProps) => {
  const { pieceModel, updateFormSchema, updatePropertySettingsSchema } =
    useStepSettingsContext();
  const form = useFormContext();

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
  const properties = (({ auth, ...rest }) => rest)(selectedAction.props);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 w-full">
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
      return <AgentTools disabled={disabled} toolsField={field} />;
    }
    case AgentPieceProps.STRUCTURED_OUTPUT: {
      return (
        <AgentStructuredOutput
          disabled={disabled}
          structuredOutputField={field}
        />
      );
    }
    default: {
      return selectGenericFormComponentForProperty(params);
    }
  }
};
