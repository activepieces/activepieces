import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField, FormItem } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/spinner';
import { PieceMetadataModel } from '@activepieces/pieces-framework';
import {
  ActionType,
  PieceAction,
  PieceTrigger,
  TriggerType,
} from '@activepieces/shared';
import { SearchableSelect } from '@/components/custom/searchable-select';

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

  const [selectedDisplayName, setSelectedDisplayName] = useState<
    string | undefined
  >(undefined);

  const watchedForm = form.watch(controlName);
  useEffect(() => {
    switch (type) {
      case ActionType.PIECE: {
        const actionName = (form.getValues() as PieceAction).settings
          .actionName;
        if (actionName) {
          setSelectedDisplayName(piece?.actions[actionName]?.displayName);
        }
        break;
      }
      case TriggerType.PIECE: {
        const triggerName = (form.getValues() as PieceTrigger).settings
          .triggerName;
        if (triggerName) {
          setSelectedDisplayName(piece?.triggers[triggerName]?.displayName);
        }
        break;
      }
    }
  }, [watchedForm]);

  const options = Object.values(((type === ActionType.PIECE ? piece?.actions : piece?.triggers)?? {})).map((actionOrTrigger) => ({
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
                placeholder={type === ActionType.PIECE? t('Select an action') : t('Select a trigger')}
                onChange={(e) => field.onChange(e)}
              />
       
        </FormItem>
      )}
    />
  );
};

PieceActionTriggerSelector.displayName = 'PieceActionTriggerSelector';
export { PieceActionTriggerSelector };
