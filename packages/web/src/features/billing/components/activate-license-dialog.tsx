import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
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
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

const LicenseKeySchema = z.object({
  tempLicenseKey: z.string({ message: t('License key is invalid') }),
});

type LicenseKeySchema = z.infer<typeof LicenseKeySchema>;

interface ActivateLicenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isTrialKey?: boolean;
  title?: string;
}

export const ActivateLicenseDialog = ({
  isOpen,
  onOpenChange,
  isTrialKey = false,
  title,
}: ActivateLicenseDialogProps) => {
  const queryClinet = useQueryClient();

  const form = useForm<LicenseKeySchema>({
    resolver: zodResolver(LicenseKeySchema),
    defaultValues: {
      tempLicenseKey: '',
    },
    mode: 'onChange',
  });

  const { mutate: activateLicenseKey, isPending } =
    platformHooks.useUpdateLisenceKey({
      queryClient: queryClinet,
      messages: { error: null },
    });

  const handleSubmit = (data: LicenseKeySchema) => {
    form.clearErrors();
    activateLicenseKey(data.tempLicenseKey, {
      onSuccess: () => handleClose(),
      onError: (error) => {
        mutationFeedback.markShown(error);
        form.setError('root.serverError', {
          type: 'manual',
          message: mutationFeedback.message(error),
        });
      },
    });
  };

  const handleClose = () => {
    form.reset();
    form.clearErrors();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title ??
              (isTrialKey
                ? t('Activate trial key')
                : t('Activate license key'))}
          </DialogTitle>
          <DialogDescription>
            {isTrialKey
              ? t('Enter your trial key to unlock enterprise features.')
              : t('Enter your license key to unlock platform features.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="tempLicenseKey"
              render={({ field }) => (
                <FormItem>
                  <Input
                    {...field}
                    required
                    type="text"
                    placeholder={
                      isTrialKey
                        ? t('Enter your trial key')
                        : t('Enter your license key')
                    }
                    disabled={isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root?.serverError && (
              <p role="alert" className="text-sm text-danger-11">
                {form.formState.errors.root.serverError.message}
              </p>
            )}
          </form>
        </Form>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button
            {...adminControl(AdminControl.BILLING_LICENSE_KEY_SUBMIT)}
            onClick={form.handleSubmit(handleSubmit)}
            disabled={!form.watch('tempLicenseKey')?.trim()}
            loading={isPending}
          >
            {t('Activate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
