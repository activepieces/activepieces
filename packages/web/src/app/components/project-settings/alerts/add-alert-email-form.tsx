import { Permission } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { alertMutations } from '@/features/alerts';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { formatUtils } from '@/lib/format-utils';

export const AddAlertEmailForm = () => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });
  const { checkAccess } = useAuthorization();
  const writeAlertPermission = checkAccess(Permission.WRITE_ALERT);

  const { mutate, isPending } = alertMutations.useCreateAlert({
    form,
    onSuccess: () => form.reset({ email: '' }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <div className="flex items-stretch">
                <Input
                  {...field}
                  id="alert-email"
                  type="text"
                  placeholder="joe@doe.com"
                  className="h-10 rounded-r-none"
                  disabled={writeAlertPermission === false}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        type="submit"
                        variant="default"
                        className="h-10 rounded-l-none border-l-0 flex items-center gap-2"
                        loading={isPending}
                        disabled={writeAlertPermission === false}
                      >
                        <Plus className="size-4" />
                        <span>{t('Add email')}</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {writeAlertPermission === false && (
                    <TooltipContent side="bottom">
                      {t('Only project admins can do this')}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {form?.formState?.errors?.root?.serverError && (
          <FormMessage className="mt-1">
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
      </form>
    </Form>
  );
};

const FormSchema = z.object({
  email: z
    .string()
    .regex(formatUtils.emailRegex, t('Please enter a valid email address')),
});

type FormSchema = z.infer<typeof FormSchema>;
