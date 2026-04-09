import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { LoadingSpinner } from '@/components/custom/spinner';
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

const LicenseKeySchema = z.object({
  tempLicenseKey: z.string({ message: t('License key is invalid') }),
});

type LicenseKeySchema = z.infer<typeof LicenseKeySchema>;

interface ActivateLicenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActivateLicenseDialog = ({
  isOpen,
  onOpenChange,
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
    platformHooks.useUpdateLisenceKey(queryClinet);

  const handleSubmit = (data: LicenseKeySchema) => {
    form.clearErrors();
    activateLicenseKey(data.tempLicenseKey, {
      onSuccess: () => handleClose(),
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
          <DialogTitle>{t('Activate License Key')}</DialogTitle>
          <DialogDescription>
            {t('Enter your license key to unlock platform features.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
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
                    placeholder={t('Enter your license key')}
                    disabled={isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>

        <DialogFooter className="gap-2">
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
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isPending || !form.watch('tempLicenseKey')?.trim()}
            className="min-w-20"
          >
            {isPending ? <LoadingSpinner className="size-4" /> : t('Activate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
