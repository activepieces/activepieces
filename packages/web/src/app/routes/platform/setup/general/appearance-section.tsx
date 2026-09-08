import { formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { platformHooks } from '@/hooks/platform-hooks';

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const form = useForm<PlatformSettingsSchema>({
    defaultValues: { name: platform?.name },
    resolver: zodResolver(PlatformSettingsSchema),
    mode: 'onChange',
  });

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      const formdata = new FormData();
      formdata.append('name', form.getValues().name);
      await platformApi.updateWithFormData(formdata, platform.id);
      window.location.reload();
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
      form.reset(form.getValues());
    },
  });

  return (
    <div className="grid gap-4">
      <Form {...form}>
        <form
          className="grid space-y-4 mt-4"
          onSubmit={form.handleSubmit(() => updatePlatform())}
        >
          <div className="max-w-[600px] grid space-y-4">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <FormLabel htmlFor="name">{t('Platform Name')}</FormLabel>
                  <Input
                    {...field}
                    required
                    id="name"
                    placeholder={t('Platform Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {form?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}
          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="submit"
              loading={isPending}
              disabled={!form.formState.isValid}
            >
              {t('Save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

const PlatformSettingsSchema = z.object({
  name: z.string().min(1, formErrors.required),
});

type PlatformSettingsSchema = z.infer<typeof PlatformSettingsSchema>;
