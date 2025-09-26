import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AgentOutputFieldType } from '@activepieces/shared';

import { FieldTypeIcon } from './field-type-icon';

interface AddFieldPopoverProps {
  onAddField: (
    type: AgentOutputFieldType,
    name: string,
    description: string,
  ) => void;
}

export const AddFieldPopover = ({ onAddField }: AddFieldPopoverProps) => {
  const [fieldType, setFieldType] = useState<AgentOutputFieldType | undefined>(
    undefined,
  );
  const [fieldName, setFieldName] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (fieldType && fieldName.trim() && fieldDescription.trim()) {
      onAddField(fieldType, fieldName.trim(), fieldDescription.trim());
      setFieldType(undefined);
      setFieldName('');
      setFieldDescription('');
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        side="bottom"
        align="center"
        sideOffset={10}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Field Type</label>
            <Select
              value={fieldType}
              onValueChange={(value) =>
                setFieldType(value as AgentOutputFieldType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AgentOutputFieldType.TEXT}>
                  <div className="flex items-center">
                    <FieldTypeIcon
                      type={AgentOutputFieldType.TEXT}
                      className="h-4 w-4 mr-2 text-muted-foreground"
                    />
                    <span>Text</span>
                  </div>
                </SelectItem>
                <SelectItem value={AgentOutputFieldType.NUMBER}>
                  <div className="flex items-center">
                    <FieldTypeIcon
                      type={AgentOutputFieldType.NUMBER}
                      className="h-4 w-4 mr-2 text-muted-foreground"
                    />
                    <span>Number</span>
                  </div>
                </SelectItem>
                <SelectItem value={AgentOutputFieldType.BOOLEAN}>
                  <div className="flex items-center">
                    <FieldTypeIcon
                      type={AgentOutputFieldType.BOOLEAN}
                      className="h-4 w-4 mr-2 text-muted-foreground"
                    />
                    <span>Yes/No</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Field Name</label>
            <Input
              id="field-name"
              placeholder="Enter field name"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Field Description</label>
            <Input
              id="field-description"
              placeholder="Enter field description"
              value={fieldDescription}
              onChange={(e) => setFieldDescription(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleAdd}
            variant={'default'}
            disabled={
              !fieldType || !fieldName.trim() || !fieldDescription.trim()
            }
          >
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
