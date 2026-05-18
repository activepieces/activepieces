import {
  formErrors,
  VARIABLE_NAME_REGEX,
  VariableWithoutSensitiveData,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { internalErrorToast } from '@/components/ui/sonner';
import { variablesApi } from '@/features/variables/api/variables';
import { authenticationSession } from '@/lib/authentication-session';

const FormSchema = z.object({
  name: z
    .string()
    .min(1, formErrors.required)
    .regex(VARIABLE_NAME_REGEX, 'invalidVariableName'),
  value: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

type VariableDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: VariableWithoutSensitiveData;
  onSaved?: (variable: VariableWithoutSensitiveData) => void;
};

type VariableFormProps = {
  existing?: VariableWithoutSensitiveData;
  onOpenChange: (open: boolean) => void;
  onSaved?: (variable: VariableWithoutSensitiveData) => void;
};

export function VariableDialog(props: VariableDialogProps) {
  const { open, onOpenChange, existing, onSaved } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <VariableForm
          key={open ? `${existing?.id ?? 'new'}-open` : 'closed'}
          existing={existing}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function VariableForm(props: VariableFormProps) {
  const { existing, onOpenChange, onSaved } = props;
  const isEdit = !!existing;
  const projectId = authenticationSession.getProjectId();
  const [valueVisible, setValueVisible] = useState(false);
  const [showValueField, setShowValueField] = useState(!isEdit);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      name: existing?.name ?? '',
      value: '',
    },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!projectId) {
        throw new Error('No project');
      }
      return variablesApi.upsert({
        projectId,
        name: values.name,
        value: values.value ?? '',
      });
    },
    onSuccess: (variable) => {
      toast.success(isEdit ? t('Variable updated') : t('Variable created'));
      onSaved?.(variable);
      onOpenChange(false);
    },
    onError: () => internalErrorToast(),
  });

  const handleSubmit = (values: FormValues) => {
    if (!values.value) {
      form.setError('value', { type: 'manual', message: formErrors.required });
      return;
    }
    save(values);
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('Edit variable') : t('New variable')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Store an API key, token, or other secret you can reuse across flow steps without exposing the value.',
            )}
          </DialogDescription>
        </DialogHeader>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Name')}</FormLabel>
              <FormControl>
                <Input {...field} disabled={isEdit} placeholder="STRIPE_PROD" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {(!isEdit || showValueField) && (
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Value')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={valueVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="pr-10"
                      placeholder={
                        isEdit ? t('Enter new value') : t('Enter the secret')
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 h-7 w-7 p-0"
                      onClick={() => setValueVisible((v) => !v)}
                      aria-label={
                        valueVisible ? t('Hide value') : t('Show value')
                      }
                    >
                      {valueVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isEdit && !showValueField && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowValueField(true)}
          >
            {t('Rotate value')}
          </Button>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {isEdit && !showValueField ? t('Close') : t('Cancel')}
            </Button>
          </DialogClose>
          {(!isEdit || showValueField) && (
            <Button type="submit" loading={isPending}>
              {isEdit ? t('Save new value') : t('Create')}
            </Button>
          )}
        </DialogFooter>
      </form>
    </Form>
  );
}
