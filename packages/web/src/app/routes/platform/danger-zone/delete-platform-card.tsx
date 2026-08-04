import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormItem,
  FormField,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { platformHooks } from '@/hooks/platform-hooks';

export const DeletePlatformCard = ({
  platformName,
}: DeletePlatformCardProps) => {
  const form = useForm<DeletePlatformFormValues>({
    resolver: zodResolver(
      z.object({
        confirmation: z.literal(platformName, 'Platform name is incorrect'),
      }),
    ),
    defaultValues: { confirmation: '' },
    mode: 'onChange',
  });
  const { mutate: deletePlatform, isPending } =
    platformHooks.useDeletePlatform();

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit(() => deletePlatform())}
      >
        <FormField
          control={form.control}
          name="confirmation"
          render={({ field }) => (
            <FormItem>
              <Input {...field} placeholder={platformName} autoComplete="off" />
              <FormMessage />
              <FormDescription className="mt-2">
                {t(
                  'Type the platform name to delete it, including every flow, connection, agent, table and project it holds.',
                )}{' '}
                <span className="text-foreground font-semibold">
                  {t('This action is irreversible.')}
                </span>
              </FormDescription>
            </FormItem>
          )}
        />
        <Button
          variant="destructive"
          type="submit"
          className="w-fit"
          disabled={!form.formState.isValid}
          loading={isPending}
        >
          {t('Delete Platform')}
        </Button>
      </form>
    </Form>
  );
};

type DeletePlatformFormValues = {
  confirmation: string;
};

type DeletePlatformCardProps = {
  platformName: string;
};
