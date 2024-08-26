import { useFormContext } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { FormField, FormItem } from '@/components/ui/form';
import { PieceMetadataModel } from '@activepieces/pieces-framework';
import {
  ActionType,
  PieceAction,
  PieceTrigger,
  TriggerType,
} from '@activepieces/shared';

type PieceActionTriggerSelectorProps = {
  piece: PieceMetadataModel;
  isLoading: boolean;
  disabled: boolean;
  type: ActionType.PIECE | TriggerType.PIECE;
};

const PieceActionTriggerSelector = ({
  piece,
  isLoading,
  type,
  disabled,
}: PieceActionTriggerSelectorProps) => {
  const form = useFormContext<PieceAction | PieceTrigger>();
  const controlName =
    type === ActionType.PIECE ? 'settings.actionName' : 'settings.triggerName';

  const options = Object.values(
    (type === ActionType.PIECE ? piece?.actions : piece?.triggers) ?? {},
  ).map((actionOrTrigger) => ({
    label: actionOrTrigger.displayName,
    value: actionOrTrigger.name,
    description: actionOrTrigger.description,
  }));

  return (
    <FormField
      name={controlName}
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <SearchableSelect
            disabled={disabled}
            value={field.value}
            options={options}
            loading={isLoading}
            placeholder={
              type === ActionType.PIECE
                ? 'Select an action'
                : 'Select a trigger'
            }
            onChange={(e) => field.onChange(e)}
          />
        </FormItem>
      )}
    />
  );
};

PieceActionTriggerSelector.displayName = 'PieceActionTriggerSelector';
export { PieceActionTriggerSelector };
