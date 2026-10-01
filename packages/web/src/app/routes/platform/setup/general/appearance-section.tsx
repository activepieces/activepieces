import { isNil } from '@activepieces/core-utils';
import { formErrors, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Upload, X } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FieldPath, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { FeatureBanner } from '@/app/components/feature-banner';
import { ColorPicker } from '@/components/custom/color-picker';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PlanBadge } from '@/features/billing/components/plan-badge';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { brandSeed } from '@/lib/brand-seed';
import { cn } from '@/lib/utils';

import { BrandColorContrast, BrandColorPreview } from './brand-color-preview';

export const AppearanceSection = ({
  ownerRow,
  dangerZone,
}: AppearanceSectionProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const brandingLocked = !platform.plan.customAppearanceEnabled;
  const initialColor = HEX_COLOR_PATTERN.test(platform.primaryColor)
    ? platform.primaryColor
    : branding.colors.primary.default;
  const [images, setImages] = useState<BrandImages>({});

  const form = useForm<PlatformAppearanceSchema>({
    defaultValues: {
      name: platform.name,
      color: initialColor,
      customThemeColors: !isNil(platform.themeColors),
      themeColors: {
        avatar: branding.colors.avatar,
        'blue-link': branding.colors['blue-link'],
        danger: branding.colors.danger,
        selection: branding.colors.selection,
        primary: {
          dark: branding.colors.primary.dark,
          light: branding.colors.primary.light,
          medium: branding.colors.primary.medium,
        },
        warn: {
          default: branding.colors.warn.default,
          light: branding.colors.warn.light,
          dark: branding.colors.warn.dark,
        },
        success: {
          default: branding.colors.success.default,
          light: branding.colors.success.light,
        },
      },
    },
    resolver: zodResolver(
      brandingLocked
        ? PlatformAppearanceSchema.extend({ color: z.string() })
        : PlatformAppearanceSchema,
    ),
    mode: 'onChange',
  });

  const previewColor = form.watch('color');
  const customThemeColors = form.watch('customThemeColors');
  const savedColor = branding.colors.primary.default;
  const imagesChanged = Object.values(images).some((image) => !isNil(image));
  const { isDirty, isValid } = form.formState;
  const dirty = isDirty || imagesChanged;
  const serverError = form.formState.errors.root?.serverError?.message;

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

  const setImage = ({
    kind,
    file,
  }: {
    kind: BrandImageKind;
    file: File | null;
  }) => {
    setImages((previous) => {
      const current = previous[kind];
      if (current) {
        URL.revokeObjectURL(current.url);
      }
      return {
        ...previous,
        [kind]: file ? { file, url: URL.createObjectURL(file) } : undefined,
      };
    });
  };

  const discard = () => {
    BRAND_IMAGES.forEach(({ kind }) => setImage({ kind, file: null }));
    form.reset();
  };

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      form.clearErrors('root.serverError');
      const { name, color, themeColors } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        if (color !== initialColor) {
          formdata.append('primaryColor', color);
        }
        formdata.append(
          'themeColors',
          form.getValues('customThemeColors')
            ? JSON.stringify(themeColors)
            : 'null',
        );
        BRAND_IMAGES.forEach(({ kind, field }) => {
          const image = images[kind];
          if (image) formdata.append(field, image.file);
        });
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
    <Form {...form}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={form.handleSubmit(() => updatePlatform())}
      >
        <Page
          width="narrow"
          footer={
            dirty || serverError ? (
              <>
                <span
                  className={cn(
                    'flex-1 text-sm',
                    serverError ? 'text-danger-11' : 'text-gray-11',
                  )}
                >
                  {serverError ?? t('You have unsaved changes')}
                </span>
                <Button type="button" variant="outline" onClick={discard}>
                  {t('Discard')}
                </Button>
                <Button type="submit" loading={isPending} disabled={!isValid}>
                  {t('Save')}
                </Button>
              </>
            ) : undefined
          }
        >
          <PageHeader
            title={t('General')}
            description={t(
              'Your platform’s name, and the logo and colours everyone sees when they sign in.',
            )}
          />

          <Panel title={t('General')} flush>
            <SettingRows>
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <SettingRow
                    title={<label htmlFor="name">{t('Platform name')}</label>}
                    description={
                      fieldState.error ? (
                        <span className="text-danger-11">
                          {t(fieldState.error.message ?? '')}
                        </span>
                      ) : (
                        t('Shown in the sidebar, emails and the sign-in page.')
                      )
                    }
                  >
                    <Input
                      {...field}
                      id="name"
                      aria-invalid={!!fieldState.error}
                      className="w-56"
                    />
                  </SettingRow>
                )}
              />
              {ownerRow}
            </SettingRows>
          </Panel>

          <Panel
            title={t('Branding')}
            action={brandingLocked ? <PlanBadge tier="enterprise" /> : null}
            flush
          >
            {brandingLocked && (
              <div className="px-4 pt-4">
                <FeatureBanner
                  message={t(
                    'Your logo and colours replace ours everywhere, including sign-in and emails.',
                  )}
                />
              </div>
            )}
            <SettingRows className={cn(brandingLocked && 'opacity-60')}>
              {BRAND_IMAGES.map((image) => (
                <BrandImageRow
                  key={image.kind}
                  title={t(image.title)}
                  hint={t(image.hint)}
                  currentUrl={platform[image.urlKey]}
                  selected={images[image.kind]}
                  disabled={brandingLocked}
                  onSelect={(file) => setImage({ kind: image.kind, file })}
                />
              ))}
              <FormField
                control={form.control}
                name="color"
                render={({ field, fieldState }) => (
                  <SettingRow
                    title={<label htmlFor="color">{t('Primary colour')}</label>}
                    description={
                      fieldState.error ? (
                        <span className="text-danger-11">
                          {t(fieldState.error.message ?? '')}
                        </span>
                      ) : (
                        t('Buttons, links and the active item in the sidebar.')
                      )
                    }
                  >
                    <ColorPicker
                      side="top"
                      disabled={brandingLocked}
                      value={field.value}
                      onChange={(color: string) => field.onChange(color)}
                      className="shrink-0"
                    />
                    <Input
                      id="color"
                      value={field.value}
                      disabled={brandingLocked}
                      maxLength={7}
                      aria-invalid={!!fieldState.error}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={field.onBlur}
                      className="w-28 font-mono"
                    />
                  </SettingRow>
                )}
              />
              <SettingRow
                title={
                  <label htmlFor="customThemeColors">
                    {t('Custom theme colours')}
                  </label>
                }
                description={t(
                  'Set your own shades, status and link colours instead of the ones derived from the primary colour.',
                )}
              >
                <FormField
                  control={form.control}
                  name="customThemeColors"
                  render={({ field }) => (
                    <Switch
                      id="customThemeColors"
                      disabled={brandingLocked}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </SettingRow>
            </SettingRows>
            {customThemeColors && !brandingLocked && (
              <div className="flex flex-col gap-4 border-t border-gray-6 p-4">
                {THEME_COLOR_GROUPS.map((group) => (
                  <div key={group.label} className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-gray-11">
                      {t(group.label)}
                    </span>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                      {group.fields.map(({ name, label }) => (
                        <FormField
                          key={name}
                          control={form.control}
                          name={name}
                          render={({ field, fieldState }) => (
                            <FormItem className="flex flex-row items-center gap-2">
                              <ColorPicker
                                className="size-8 shrink-0"
                                value={field.value as string}
                                onChange={(color: string) =>
                                  field.onChange(color)
                                }
                              />
                              <div className="flex min-w-0 flex-col">
                                <FormLabel className="font-normal">
                                  {t(label)}
                                </FormLabel>
                                <span
                                  className={cn(
                                    'font-mono text-xs',
                                    fieldState.error
                                      ? 'text-danger-11'
                                      : 'text-gray-11',
                                  )}
                                >
                                  {field.value as string}
                                </span>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={() => form.resetField('themeColors')}
                >
                  {t('Reset to derived')}
                </Button>
              </div>
            )}
          </Panel>

          {HEX_COLOR_PATTERN.test(previewColor) && (
            <div
              className={cn(
                'flex flex-col gap-4 rounded-2xl border border-dashed border-gray-7 p-4',
                brandingLocked && 'opacity-60',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-12">
                    {t('Live preview')}
                  </span>
                  <span className="text-xs text-gray-11">
                    {t(
                      'How the primary colour reads in both themes, with the label colour picked for it.',
                    )}
                  </span>
                </div>
                <BrandColorContrast color={previewColor} />
              </div>
              <BrandColorPreview color={previewColor} />
            </div>
          )}

          {dangerZone}
        </Page>
      </form>
    </Form>
  );
};

const BrandImageRow = ({
  title,
  hint,
  currentUrl,
  selected,
  disabled,
  onSelect,
}: BrandImageRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <SettingRow
      title={title}
      description={selected ? selected.file.name : hint}
    >
      <LogoPlate
        src={selected?.url ?? currentUrl}
        alt={title}
        size="md"
        border
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          onSelect(event.target.files?.[0] ?? null);
          event.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {t('Upload')}
      </Button>
      {selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('Undo')}
          onClick={() => onSelect(null)}
        >
          <X />
        </Button>
      )}
    </SettingRow>
  );
};

const hexColor = z.string().regex(HEX_COLOR_PATTERN, 'invalidHexColor');

const ThemeColorsSchema = z.object({
  avatar: hexColor,
  'blue-link': hexColor,
  danger: hexColor,
  selection: hexColor,
  primary: z.object({
    dark: hexColor,
    light: hexColor,
    medium: hexColor,
  }),
  warn: z.object({
    default: hexColor,
    light: hexColor,
    dark: hexColor,
  }),
  success: z.object({
    default: hexColor,
    light: hexColor,
  }),
});

const PlatformAppearanceSchema = z.object({
  name: z.string().min(1, formErrors.required),
  color: hexColor,
  customThemeColors: z.boolean(),
  themeColors: ThemeColorsSchema,
});

const BRAND_IMAGES: BrandImageSpec[] = [
  {
    kind: 'logo',
    field: 'fullLogo',
    urlKey: 'fullLogoUrl',
    title: 'Logo',
    hint: 'The full logo in the sidebar, emails and the sign-in page.',
  },
  {
    kind: 'icon',
    field: 'logoIcon',
    urlKey: 'logoIconUrl',
    title: 'Icon',
    hint: 'The square mark used where the full logo does not fit.',
  },
  {
    kind: 'favicon',
    field: 'favIcon',
    urlKey: 'favIconUrl',
    title: 'Favicon',
    hint: 'The small icon in the browser tab.',
  },
];

const THEME_COLOR_GROUPS: {
  label: string;
  fields: { name: FieldPath<PlatformAppearanceSchema>; label: string }[];
}[] = [
  {
    label: 'Brand shades',
    fields: [
      { name: 'themeColors.primary.light', label: 'Primary light' },
      { name: 'themeColors.primary.medium', label: 'Primary medium' },
      { name: 'themeColors.primary.dark', label: 'Primary dark' },
    ],
  },
  {
    label: 'Status',
    fields: [
      { name: 'themeColors.danger', label: 'Danger' },
      { name: 'themeColors.warn.default', label: 'Warning' },
      { name: 'themeColors.warn.light', label: 'Warning light' },
      { name: 'themeColors.warn.dark', label: 'Warning dark' },
      { name: 'themeColors.success.default', label: 'Success' },
      { name: 'themeColors.success.light', label: 'Success light' },
    ],
  },
  {
    label: 'Other',
    fields: [
      { name: 'themeColors.blue-link', label: 'Link' },
      { name: 'themeColors.avatar', label: 'Avatar' },
      { name: 'themeColors.selection', label: 'Selection' },
    ],
  },
];

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;

type BrandImageKind = 'logo' | 'icon' | 'favicon';

type BrandImageSelection = { file: File; url: string };

type BrandImages = Partial<Record<BrandImageKind, BrandImageSelection>>;

type BrandImageSpec = {
  kind: BrandImageKind;
  field: 'fullLogo' | 'logoIcon' | 'favIcon';
  urlKey: 'fullLogoUrl' | 'logoIconUrl' | 'favIconUrl';
  title: string;
  hint: string;
};

type BrandImageRowProps = {
  title: string;
  hint: string;
  currentUrl: string;
  selected: BrandImageSelection | undefined;
  disabled: boolean;
  onSelect: (file: File | null) => void;
};

type AppearanceSectionProps = {
  ownerRow?: React.ReactNode;
  dangerZone?: React.ReactNode;
};
