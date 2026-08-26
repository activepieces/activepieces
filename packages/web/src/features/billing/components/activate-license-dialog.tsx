import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  isTrialKey?: boolean;
  initialLicenseKey?: string;
  autoSubmit?: boolean;
}

export const ActivateLicenseDialog = ({
  isOpen,
  onOpenChange,
  isTrialKey = false,
  initialLicenseKey = '',
  autoSubmit = false,
}: ActivateLicenseDialogProps) => {
  const queryClinet = useQueryClient();
  const [trialActivated, setTrialActivated] = useState(false);

  const form = useForm<LicenseKeySchema>({
    resolver: zodResolver(LicenseKeySchema),
    defaultValues: {
      tempLicenseKey: initialLicenseKey,
    },
    mode: 'onChange',
  });

  const { mutate: activateLicenseKey, isPending } =
    platformHooks.useUpdateLisenceKey({
      queryClient: queryClinet,
      ...(isTrialKey ? { messages: { success: null } } : {}),
    });

  const handleSubmit = (data: LicenseKeySchema) => {
    form.clearErrors();
    activateLicenseKey(data.tempLicenseKey, {
      onSuccess: () => {
        if (isTrialKey) {
          setTrialActivated(true);
          return;
        }
        handleClose();
      },
    });
  };

  const submitted = useRef(false);
  useEffect(() => {
    if (!autoSubmit || submitted.current || initialLicenseKey.length === 0) {
      return;
    }
    submitted.current = true;
    handleSubmit({ tempLicenseKey: initialLicenseKey });
  }, [autoSubmit, initialLicenseKey]);

  const handleClose = () => {
    form.reset();
    form.clearErrors();
    setTrialActivated(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        {trialActivated ? (
          <>
            <DialogHeader className="items-center gap-4">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Check className="size-10 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-semibold">
                {t('Your trial is active 🎉')}
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                {t('Enjoy your trial — happy automating! 🎊')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                {t('Close')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {isTrialKey
                  ? t('Activate Trial Key')
                  : t('Activate License Key')}
              </DialogTitle>
              <DialogDescription>
                {isTrialKey
                  ? t('Enter your trial key to unlock enterprise features.')
                  : t('Enter your license key to unlock platform features.')}
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
                {isPending ? (
                  <LoadingSpinner className="size-4" />
                ) : (
                  t('Activate')
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
