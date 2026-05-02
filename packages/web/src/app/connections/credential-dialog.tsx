import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  formErrors,
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
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { authenticationSession } from '@/lib/authentication-session';

const CREDENTIAL_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

const FormSchema = z.object({
  displayName: z
    .string()
    .min(1, formErrors.required)
    .regex(CREDENTIAL_NAME_REGEX, 'invalidCredentialName'),
  value: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

type CredentialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: AppConnectionWithoutSensitiveData;
  onSaved?: (credential: AppConnectionWithoutSensitiveData) => void;
};

type CredentialFormProps = {
  existing?: AppConnectionWithoutSensitiveData;
  onOpenChange: (open: boolean) => void;
  onSaved?: (credential: AppConnectionWithoutSensitiveData) => void;
};

export function CredentialDialog(props: CredentialDialogProps) {
  const { open, onOpenChange, existing, onSaved } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <CredentialForm
          key={open ? `${existing?.id ?? 'new'}-open` : 'closed'}
          existing={existing}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function CredentialForm(props: CredentialFormProps) {
  const { existing, onOpenChange, onSaved } = props;
  const isEdit = !!existing;
  const projectId = authenticationSession.getProjectId();
  const [valueVisible, setValueVisible] = useState(false);
  const [showValueField, setShowValueField] = useState(!isEdit);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: existing?.displayName ?? '',
      value: '',
    },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!projectId) {
        throw new Error('No project');
      }
      if (isEdit && !showValueField) {
        return existing!;
      }
      return appConnectionsApi.upsert({
        projectId,
        externalId: existing?.externalId ?? values.displayName,
        displayName: values.displayName,
        type: AppConnectionType.SECRET_TEXT,
        value: {
          type: AppConnectionType.SECRET_TEXT,
          secret_text: values.value ?? '',
        },
      });
    },
    onSuccess: (credential) => {
      toast.success(isEdit ? t('Credential updated') : t('Credential created'));
      onSaved?.(credential);
      onOpenChange(false);
    },
    onError: () => internalErrorToast(),
  });

  const handleSubmit = (values: FormValues) => {
    const valueRequired = !isEdit || showValueField;
    if (valueRequired && !values.value) {
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
            {isEdit ? t('Edit credential') : t('New credential')}
          </DialogTitle>
          <DialogDescription>
            {t('Encrypted at rest. Reference it via {ref}.', {
              ref: "{{connections['NAME']}}",
            })}
          </DialogDescription>
        </DialogHeader>
        <FormField
          control={form.control}
          name="displayName"
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
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
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
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={isPending}>
            {isEdit ? t('Save') : t('Create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
