import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { AIProviderModelType, ProviderModelConfig } from '@activepieces/shared';

type ModelFormPopoverProps = {
  initialData?: ProviderModelConfig;
  onSubmit: (model: ProviderModelConfig) => void;
  children: React.ReactNode;
};

const ModelFormPopover = ({
  initialData,
  onSubmit,
  children,
}: ModelFormPopoverProps) => {
  const [open, setOpen] = useState(false);
  const defaultModel: ProviderModelConfig = {
    modelId: '',
    modelName: '',
    modelType: AIProviderModelType.TEXT,
  };

  const [model, setModel] = useState<ProviderModelConfig>(
    initialData || defaultModel,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(model);
    if (!initialData) {
      setModel(defaultModel);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              {initialData ? t('Edit Model') : t('Add Model')}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('Configure the model settings')}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelId">{t('Model ID')}</Label>
              <Input
                id="modelId"
                value={model.modelId}
                onChange={(e) =>
                  setModel({ ...model, modelId: e.target.value })
                }
                placeholder="e.g., gpt-4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelName">{t('Model Name')}</Label>
              <Input
                id="modelName"
                value={model.modelName}
                onChange={(e) =>
                  setModel({ ...model, modelName: e.target.value })
                }
                placeholder="e.g., GPT-4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelType">{t('Model Type')}</Label>
              <Select
                value={model.modelType}
                onValueChange={(value) =>
                  setModel({
                    ...model,
                    modelType: value as AIProviderModelType,
                  })
                }
              >
                <SelectTrigger id="modelType">
                  <SelectValue placeholder={'Select model type'} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AIProviderModelType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit">
                {initialData ? t('Update') : t('Add')}
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
};

ModelFormPopover.displayName = 'ModelFormPopover';
export { ModelFormPopover };
