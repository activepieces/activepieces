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

  const options = type === ActionType.PIECE ? piece?.actions : piece?.triggers;

  return (
    <FormField
      name={controlName}
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <Select
            defaultValue={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" asChild>
                <>{selectedDisplayName}</>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                Object.values(options ?? {}).map((actionOrTrigger) => {
                  return (
                    <SelectItem
                      value={actionOrTrigger.name}
                      key={actionOrTrigger.name}
                      className="w-full"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <span className="truncate">
                          {actionOrTrigger.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground break-words">
                          {actionOrTrigger.description}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

PieceActionTriggerSelector.displayName = 'PieceActionTriggerSelector';
export { PieceActionTriggerSelector };
