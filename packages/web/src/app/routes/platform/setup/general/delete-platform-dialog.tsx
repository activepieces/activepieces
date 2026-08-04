import { PLATFORM_PURGE_DELAY_DAYS } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

export const DeletePlatformDialog = ({
  platformName,
  open,
  onOpenChange,
}: DeletePlatformDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DeletePlatformForm
        key={open ? 'open' : 'closed'}
        platformName={platformName}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);

const DeletePlatformForm = ({
  platformName,
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
      <form onSubmit={form.handleSubmit(() => deletePlatform())}>
        <DialogHeader>
          <DialogTitle>{t('Delete platform')}</DialogTitle>
          <DialogDescription>
            {t(
              'Every flow stops running and every API key is revoked immediately. Members lose access right away.',
            )}{' '}
            {t(
              'All projects, flows, connections, agents and tables are permanently erased on {date}.',
              { date: purgeDate },
            )}{' '}
            <span className="text-foreground font-medium">
              {t('This cannot be undone.')}
            </span>{' '}
            {t('Contact support before {date} if this was a mistake.', {
              date: purgeDate,
            })}
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
  onCancel: () => void;
};

type DeletePlatformDialogProps = {
  platformName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
