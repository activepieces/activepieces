import { t } from 'i18next';
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

  if (!isCloudPlanButNotEnterprise(platform.plan.plan) || isNil(userEmail)) {
    return null;
  }

  return (
    <>
      <Separator />
      <Form {...form}>
        <form
          className="flex items-center justify-between"
          onSubmit={form.handleSubmit(() => deleteAccount())}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>{t('Email')}</FormLabel>
                  <Input {...field} placeholder={userEmail} />
                  <FormDescription>
                    {t(
                      'Please enter your email to delete your account, this action is irreversible.',
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <Button variant="destructive" type="submit" loading={isPending}>
            {t('Delete Account')}
          </Button>
        </form>
      </Form>
    </>
  );
};
