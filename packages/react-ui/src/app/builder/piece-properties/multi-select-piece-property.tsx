import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/custom/multi-select';
import { Button } from '@/components/ui/button';

type MultiSelectOption = {
  label: string;
  value: unknown;
};

type MultiSelectPiecePropertyProps = {
  placeholder: string;
  options: MultiSelectOption[];
  onChange: (value: unknown[]) => void;
  initialValues: unknown[];
  disabled?: boolean;
  enableSelectOrClear?: boolean;
};

const MultiSelectPieceProperty = ({
  placeholder,
  options,
  onChange,
  disabled,
  initialValues,
  enableSelectOrClear,
}: MultiSelectPiecePropertyProps) => {
  const selectedIndicies = Array.isArray(initialValues)
    ? initialValues
        .map((value) =>
          String(options.findIndex((option) => option.value === value)),
        )
        .filter((index) => index !== undefined && index !== '-1') || []
    : [];

  const sendChanges = (indicides: string[]) => {
    const newSelectedIndicies = indicides.filter(
      (index) => index !== undefined,
    );
    onChange(newSelectedIndicies.map((index) => options[Number(index)].value));
  };

  return (
    <MultiSelect
      value={selectedIndicies}
      onValueChange={sendChanges}
      disabled={disabled}
    >
      <MultiSelectTrigger className="w-full">
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch />
        {enableSelectOrClear && (
          <SelectOrClear
            sendChanges={(changeType) => {
              switch (changeType) {
                case 'selectAll':
                  sendChanges(options.map((_, i) => i.toString()));
                  break;
                case 'clear':
                  sendChanges([]);
                  break;
              }
            }}
          />
        )}

        <MultiSelectList>
          {options.map((option, index) => (
            <MultiSelectItem key={index} value={String(index)}>
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};

const SelectOrClear = ({
  sendChanges,
}: {
  sendChanges: (changeType: 'selectAll' | 'clear') => void;
}) => (
  <div className="flex justify-center py-1">
    <Button
      variant="transparent"
      size="sm"
      onClick={() => sendChanges('selectAll')}
    >
      Select All
    </Button>
    <Button
      variant="transparent"
      size="sm"
      onClick={() => sendChanges('clear')}
    >
      Clear all
    </Button>
  </div>
);

MultiSelectPieceProperty.displayName = 'MultiSelectPieceProperty';
export { MultiSelectPieceProperty };
