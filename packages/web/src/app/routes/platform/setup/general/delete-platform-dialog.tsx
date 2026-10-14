import { PLATFORM_PURGE_DELAY_DAYS } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminLayout } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

export const DeletePlatformDialog = ({
  platformName,
  open,
  onOpenChange,
  standDown,
}: DeletePlatformDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={adminLayout.dialog.sm}>
      <DeletePlatformForm
        key={open ? 'open' : 'closed'}
        platformName={platformName}
        standDown={standDown}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);

const DeletePlatformForm = ({
  platformName,
  standDown,
  onCancel,
}: DeletePlatformFormProps) => {
  const confirmationTarget =
    platformName.trim().length > 0
      ? platformName.trim()
      : FALLBACK_CONFIRMATION;
  const form = useForm<DeletePlatformFormValues>({
    resolver: zodResolver(
      z.object({
        confirmation: z
          .string()
          .trim()
          .refine(
            (value) => value === confirmationTarget,
            'Platform name is incorrect',
          ),
      }),
    ),
    defaultValues: { confirmation: '' },
    mode: 'onChange',
  });
  const { mutate: deletePlatform, isPending } =
    platformHooks.useDeletePlatform();
  const purgeDate = dayjs()
    .add(PLATFORM_PURGE_DELAY_DAYS, 'day')
    .format('MMMM D, YYYY');

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.stopPropagation();
          form.handleSubmit(() => {
            standDown.current = true;
            deletePlatform(undefined, {
              onError: () => {
                standDown.current = false;
              },
            });
          })(event);
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('Delete platform')}</DialogTitle>
          <DialogDescription className="flex flex-col gap-3">
            <span className="text-gray-12 font-medium">
              {t(
                '{name} will be deleted for everyone. This cannot be undone.',
                {
                  name: confirmationTarget,
                },
              )}
            </span>
            <span>
              {t(
                'Access ends the moment you confirm: everyone is signed out, every flow stops running, and all API keys stop working.',
              )}
            </span>
            <span>
              {t(
                'Your projects, flows, connections, agents and tables are erased on {date}.',
                { date: purgeDate },
              )}
            </span>
          </DialogDescription>
        </DialogHeader>
        <FormField
          control={form.control}
          name="confirmation"
          render={({ field }) => (
            <FormItem className="my-5 flex flex-col gap-2">
              <FormLabel>
                {t('Type {name} to confirm', { name: confirmationTarget })}
              </FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.GENERAL_PLATFORM_DELETE_CONFIRM)}
            variant="destructive"
            type="submit"
            disabled={!form.formState.isValid}
            loading={isPending}
          >
            {t('Delete platform')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

type DeletePlatformFormValues = {
  confirmation: string;
};

const FALLBACK_CONFIRMATION = 'delete platform';

type DeletePlatformFormProps = {
  platformName: string;
  standDown: RefObject<boolean>;
  onCancel: () => void;
};

type DeletePlatformDialogProps = {
  platformName: string;
  standDown: RefObject<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
