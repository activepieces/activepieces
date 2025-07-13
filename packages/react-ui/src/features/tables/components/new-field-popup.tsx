import { t } from 'i18next';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';

import { ArrayInput } from '@/components/custom/array-input';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTableState } from '@/features/tables/components/ap-table-state-provider';
import { tablesUtils } from '@/features/tables/lib/utils';
import { cn } from '@/lib/utils';
import { FieldType, isNil } from '@activepieces/shared';

type NewFieldDialogProps = {
  children: React.ReactNode;
};

type NewFieldFormData =
  | {
      name: string;
      type: FieldType.STATIC_DROPDOWN;
      data: {
        options: string[];
      };
    }
  | {
      name: string;
      type: FieldType.DATE | FieldType.NUMBER | FieldType.TEXT;
      data: null;
    };

const FIELD_TYPE_FRIENDLY_NAME: Record<FieldType, string> = {
  [FieldType.TEXT]: 'Text',
  [FieldType.NUMBER]: 'Number',
  [FieldType.DATE]: 'Date',
  [FieldType.STATIC_DROPDOWN]: 'Dropdown',
};

export function NewFieldPopup({ children }: NewFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const fields = useTableState((state) => state.fields);
  const createField = useTableState((state) => state.createField);

  const form = useForm<NewFieldFormData>({
    resolver: (data) => {
      const errors: FieldErrors<NewFieldFormData> = {};
      if (data.name.length === 0) {
        errors['name'] = {
          message: t('Name is required'),
          type: 'required',
        };
      } else {
        if (fields?.find((field) => field.name === data.name)) {
          errors['name'] = {
            message: t('Name must be unique'),
            type: 'unique',
          };
        }
      }
      if (isNil(data.type)) {
        errors['type'] = {
          message: t('Type is required'),
          type: 'required',
        };
      }
      if (
        data.type === FieldType.STATIC_DROPDOWN &&
        (isNil(data.data) ||
          data.data?.options.length === 0 ||
          !data.data?.options.some((option) => option.length > 0))
      ) {
        errors['data'] = {
          options: {
            message: t('Please add at least one option'),
            type: 'required',
          },
        };
      }
      return {
        values: Object.keys(errors).length === 0 ? data : {},
        errors,
      };
    },
    defaultValues: {
      type: FieldType.TEXT,
      data: null,
      name: '',
    },
  });

  return (
    <Popover open={open} modal={false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[400px] py-4 px-2 drop-shadow-xl">
        <div className="text-lg font-semibold mb-4 px-3">{t('New Field')}</div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              form.reset();
              setOpen(false);
              if (data.type === FieldType.STATIC_DROPDOWN) {
                createField({
                  uuid: nanoid(),
                  name: data.name,
                  type: data.type,
                  data: {
                    options: data.data.options
                      .filter((option) => option.length > 0)
                      .map((option) => ({
                        value: option,
                      })),
                  },
                });
              } else {
                createField({
                  uuid: nanoid(),
                  name: data.name,
                  type: data.type,
                });
              }
            })}
            className="mx-2"
          >
            <div className="max-h-[80vh]  overflow-y-auto space-y-4 px-1 ">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid space-y-3">
                    <Label htmlFor="name">{t('Name')}</Label>
                    <Input thin={true} {...field} id="name" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label>{t('Type')}</Label>
                    <ScrollArea className="max-h-[200px] rounded-md border">
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          if (value === FieldType.STATIC_DROPDOWN) {
                            form.setValue('data', {
                              options: [''],
                            });
                          } else {
                            form.setValue('data', null);
                          }
                          field.onChange(value);
                        }}
                        className="p-1"
                      >
                        {Object.values(FieldType).map((type) => (
                          <div key={type} className="flex items-center">
                            <RadioGroupItem
                              value={type}
                              id={type}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={type}
                              className={cn(
                                'flex items-center gap-2 w-full px-3 py-2 rounded-sm',
                                'text-left text-accent-foreground cursor-pointer hover:bg-muted',
                                field.value === type && 'bg-muted text-primary',
                              )}
                            >
                              {tablesUtils.getColumnIcon(type)}
                              {FIELD_TYPE_FRIENDLY_NAME[type]
                                ? t(FIELD_TYPE_FRIENDLY_NAME[type])
                                : t(type)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('type') === FieldType.STATIC_DROPDOWN && (
                <FormField
                  control={form.control}
                  name="data.options"
                  render={({ field }) => (
                    //needs to be wrapped in form field to show the error message
                    <FormItem className="grid space-y-3">
                      <Label>{t('Options')}</Label>
                      <ArrayInput
                        inputName="data.options"
                        disabled={false}
                        required={true}
                        thinInputs={true}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 mt-3">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" size="sm">
                {t('Create')}
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
