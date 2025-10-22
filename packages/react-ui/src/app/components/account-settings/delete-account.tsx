import { t } from 'i18next';
import { Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { isCloudPlanButNotEnterprise } from '@activepieces/ee-shared';
import { isNil } from '@activepieces/shared';

export const DeleteAccount = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: user } = userHooks.useCurrentUser();
  const userEmail = user?.email;
  const form = useForm<{ email: string }>({
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: (values) => {
      const errors: Record<string, { message: string }> = {};
      if (values.email !== userEmail) {
        errors.email = {
          message: t('Email is incorrect'),
        };
      }
      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
  });
  const { mutate: deleteAccount, isPending } = platformHooks.useDeleteAccount();
  const isDeleteButtonDisabled =
    !isNil(form.formState.errors.email) ||
    form.getValues('email') !== userEmail;

  if (!isCloudPlanButNotEnterprise(platform.plan.plan) || isNil(userEmail)) {
    return null;
  }

  return (
    <>
      <Separator />
      <Form {...form}>
        <form
          className="w-full"
          onSubmit={form.handleSubmit(() => deleteAccount())}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-2">
                    {' '}
                    <Trash className="w-4 h-4" /> {t('Delete Your Account')}
                  </FormLabel>
                  <div className="flex items-center gap-4 w-full">
                    <Input
                      {...field}
                      className="grow"
                      placeholder={userEmail}
                      autoComplete="off"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant="destructive"
                            type="submit"
                            disabled={isDeleteButtonDisabled}
                            loading={isPending}
                          >
                            {t('Delete')}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {isDeleteButtonDisabled && (
                        <TooltipContent>
                          {t('Please enter your email first.')}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                  <FormMessage />

                  <FormDescription>
                    <p className="mt-2">
                      {t(
                        'Enter your email to delete your account, including your flows, connections, agents, tables and projects.',
                      )}{' '}
                      <span className="text-foreground font-semibold">
                        {t('This action is irreversible.')}
                      </span>
                    </p>
                  </FormDescription>
                </FormItem>
              );
            }}
          />
        </form>
      </Form>
    </>
  );
};
