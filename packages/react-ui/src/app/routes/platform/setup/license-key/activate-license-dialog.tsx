import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Lottie from 'react-lottie';

import celebrationAnimation from '@/assets/img/custom/celeberation.json';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/spinner';
import { platformApi } from '@/lib/platforms-api';

const LicenseKeySchema = Type.Object({
  tempLicenseKey: Type.String({
    errorMessage: t('License key is invalid'),
  }),
});

type LicenseKeySchema = Static<typeof LicenseKeySchema>;

interface ActivateLicenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: () => void;
}

export const ActivateLicenseDialog = ({
  isOpen,
  onOpenChange,
  onActivate,
}: ActivateLicenseDialogProps) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const form = useForm<LicenseKeySchema>({
    resolver: typeboxResolver(LicenseKeySchema),
    defaultValues: {
      tempLicenseKey: '',
    },
    mode: 'onChange',
  });

  const { mutate: activateLicenseKey, isPending } = useMutation({
    mutationFn: async (tempLicenseKey: string) => {
      if (tempLicenseKey.trim() === '') return;
      await platformApi.verifyLicenseKey(tempLicenseKey.trim());
    },
    onSuccess: () => {
      setShowCelebration(true);
      onActivate();
      form.reset();
    },
    onError: () => {
      form.setError('tempLicenseKey', {
        message: t('Invalid license key'),
      });
    },
  });

  const handleSubmit = (data: LicenseKeySchema) => {
    form.clearErrors();
    activateLicenseKey(data.tempLicenseKey);
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: celebrationAnimation,
    animationSpeed: 4,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShowCelebration(false);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {showCelebration
              ? t('Woohoo! It worked')
              : t('Activate License Key')}
          </DialogTitle>
        </DialogHeader>
        {!showCelebration && (
          <Form {...form}>
            <form className="grid space-y-4 text-center">
              <FormField
                control={form.control}
                name="tempLicenseKey"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Input
                      {...field}
                      required
                      id="tempLicenseKey"
                      type="text"
                      placeholder={'Enter your license key'}
                      className="rounded-sm"
                      tabIndex={1}
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
        )}
        {showCelebration && (
          <div className="celebration-lottie text-center">
            <Lottie options={defaultOptions} height={200} width={200} />
            <div className="text-center mt-4">
              <p className="text-md text-gray-500">
                {t('Enjoy the awesome enterprise features')}
              </p>
            </div>
          </div>
        )}
        <DialogFooter className="justify-center">
          {showCelebration ? (
            <div className="flex justify-center w-full">
              <DialogClose asChild>
                <Button size={'sm'} onClick={() => onOpenChange(false)}>
                  {t('Close')}
                </Button>
              </DialogClose>
            </div>
          ) : (
            <Button
              loading={isPending}
              onClick={(e) => form.handleSubmit(handleSubmit)(e)}
              tabIndex={3}
              className="w-full"
            >
              {isPending ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                t('Activate')
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
