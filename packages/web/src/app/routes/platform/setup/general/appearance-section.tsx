import { formErrors, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { FeatureBanner } from '@/app/components/feature-banner';
import { ColorPicker } from '@/components/custom/color-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { brandSeed } from '@/lib/brand-seed';

import { BrandColorPreview } from './brand-color-preview';

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const brandingLocked = !platform.plan.customAppearanceEnabled;
  const initialColor = HEX_COLOR_PATTERN.test(platform.primaryColor)
    ? platform.primaryColor
    : branding.colors.primary.default;

  const form = useForm<PlatformAppearanceSchema>({
    defaultValues: {
      name: platform.name,
      color: initialColor,
    },
    resolver: zodResolver(
      brandingLocked
        ? PlatformAppearanceSchema.extend({ color: z.string() })
        : PlatformAppearanceSchema,
    ),
    mode: 'onChange',
  });

  const previewColor = form.watch('color');
  const savedColor = branding.colors.primary.default;

  useEffect(() => {
    if (brandingLocked || !HEX_COLOR_PATTERN.test(previewColor)) {
      return;
    }
    brandSeed.apply({ primaryColor: previewColor });
  }, [previewColor, brandingLocked]);

  useEffect(
    () => () => brandSeed.apply({ primaryColor: savedColor }),
    [savedColor],
  );

  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      form.clearErrors('root.serverError');
      const logo = logoRef.current?.files?.[0];
      const icon = iconRef.current?.files?.[0];
      const favicon = faviconRef.current?.files?.[0];
      const { name, color } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        if (color !== initialColor) {
          formdata.append('primaryColor', color);
        }
        if (logo) formdata.append('fullLogo', logo);
        if (icon) formdata.append('logoIcon', icon);
        if (favicon) formdata.append('favIcon', favicon);
      }

      await platformApi.updateWithFormData(formdata, platform.id);
      window.location.reload();
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
      form.reset(form.getValues());
    },
    onError: () => {
      form.setError('root.serverError', {
        type: 'manual',
        message: t('Failed to save changes. Please try again.'),
      });
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

            {brandingLocked && (
              <FeatureBanner
                message={t(
                  'Your logo, colors and favicon are part of custom branding.',
                )}
              />
            )}

            <div className="grid space-y-2">
              <Label htmlFor="logoFile">{t('Logo')}</Label>
              <Input
                type="file"
                ref={logoRef}
                defaultFileName={platform.fullLogoUrl}
                accept="image/*"
                id="logoFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="iconFile">{t('Icon')}</Label>
              <Input
                type="file"
                ref={iconRef}
                defaultFileName={platform.logoIconUrl}
                accept="image/*"
                id="iconFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="faviconFile">{t('Favicon')}</Label>
              <Input
                type="file"
                ref={faviconRef}
                defaultFileName={platform.favIconUrl}
                accept="image/*"
                id="faviconFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>

            <FormField
              name="color"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <FormLabel htmlFor="color">{t('Primary Color')}</FormLabel>
                  <div className="flex flex-row gap-2 items-center">
                    <ColorPicker
                      side="top"
                      disabled={brandingLocked}
                      value={field.value}
                      onChange={(color: string) => field.onChange(color)}
                      className="flex flex-row gap-2 items-center"
                    ></ColorPicker>
                    <FormMessage />
                  </div>
                  <BrandColorPreview color={field.value} />
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
            {form.formState.isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                {t('Cancel')}
              </Button>
            )}
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

const PlatformAppearanceSchema = z.object({
  name: z.string().min(1, formErrors.required),
  color: z.string().regex(HEX_COLOR_PATTERN, 'invalidHexColor'),
});

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;
