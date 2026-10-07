import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  brandColors,
  formErrors,
  HEX_COLOR_PATTERN,
  PlatformAdminSurface,
  ThemeHexColor,
  PlatformThemeColors,
  StatusColors,
  StatusScale,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Crown, ExternalLink } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import {
  AdminPage,
  SaveBar,
  SaveBarLock,
  SettingsPanel,
  SettingsRow,
} from '@/app/components/admin';
import { ColorPicker } from '@/components/custom/color-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TIER_LABELS, useUpgradeClick } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { brandSeed } from '@/lib/brand-seed';

import { BrandImageField } from './brand-image-field';
import { ColorPreview, ColorTone } from './color-preview';

export const AppearanceSection = ({
  header,
  children,
}: AppearanceSectionProps) => {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: maxFileSizeMb } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FILE_SIZE_MB,
  );
  const upgradeClick = useUpgradeClick();
  const brandingLocked = !platform.plan.customAppearanceEnabled;
  const initialColor = HEX_COLOR_PATTERN.test(platform.primaryColor)
    ? platform.primaryColor
    : branding.colors.primary.default;

  const storedStatusColors = brandingLocked
    ? branding.statusColors
    : platform.themeColors?.status;

  const form = useForm<PlatformAppearanceSchema>({
    defaultValues: {
      name: platform.name,
      color: initialColor,
      statusColors: {
        danger: storedStatusColors?.danger,
        warning: storedStatusColors?.warning,
        success: storedStatusColors?.success,
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
  const [previewDanger, previewWarning, previewSuccess] = form.watch([
    'statusColors.danger',
    'statusColors.warning',
    'statusColors.success',
  ]);
  const savedColor = branding.colors.primary.default;

  useEffect(() => {
    brandSeed.setPreview({
      primaryColor: HEX_COLOR_PATTERN.test(previewColor)
        ? previewColor
        : savedColor,
      statusColors: {
        danger: previewDanger,
        warning: previewWarning,
        success: previewSuccess,
      },
    });
    return () => brandSeed.clearPreview();
  }, [previewColor, previewDanger, previewWarning, previewSuccess, savedColor]);

  const statusLabels: Record<StatusScale, string> = {
    danger: t('Danger'),
    warning: t('Warning'),
    success: t('Success'),
  };

  const [images, setImages] = useState<BrandImages>(EMPTY_IMAGES);
  const { isDirty, errors, dirtyFields } = form.formState;
  const hasFieldErrors = Object.keys(errors).some((field) => field !== 'root');
  const imagesChanged = Object.values(images).some((file) => !isNil(file));
  const hasChanges = isDirty || imagesChanged;
  const nameDirty = dirtyFields.name === true;
  const brandingDirty =
    imagesChanged ||
    dirtyFields.color === true ||
    Object.values(dirtyFields.statusColors ?? {}).some(Boolean);
  const previewingLockedBranding = brandingLocked && brandingDirty;
  const tierLabel = TIER_LABELS[BRANDING_TIER];
  const [imageFieldsKey, setImageFieldsKey] = useState(0);
  const clearImages = () => {
    setImages(EMPTY_IMAGES);
    setImageFieldsKey((key) => key + 1);
  };

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      form.clearErrors('root.serverError');
      const { name, color, statusColors } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        if (color !== initialColor) {
          formdata.append('primaryColor', color);
        }
        formdata.append(
          'themeColors',
          JSON.stringify(
            withStatusColors({
              themeColors: platform.themeColors,
              statusColors,
            }),
          ),
        );
        BRAND_IMAGES.forEach(({ kind, field }) => {
          const file = images[kind];
          if (file) formdata.append(field, file);
        });
      }

      await platformApi.updateWithFormData(formdata, platform.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform', platform.id] }),
        queryClient.invalidateQueries({ queryKey: flagsHooks.queryKey }),
      ]);
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
      if (brandingLocked) {
        form.resetField('name', { defaultValue: form.getValues('name') });
        return;
      }
      clearImages();
      form.reset(form.getValues());
    },
    onError: () => {
      form.setError('root.serverError', {
        type: 'manual',
        message: t('Failed to save changes. Please try again.'),
      });
    },
  });

  const lockedSave: SaveBarLock | undefined = previewingLockedBranding
    ? {
        message: t("Branding preview isn't saved"),
        canSaveRest: nameDirty,
        action:
          edition === ApEdition.COMMUNITY ? (
            <Button type="button" asChild>
              <a
                href={ENTERPRISE_DOCUMENTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Read the docs')}
                <ExternalLink />
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() =>
                upgradeClick({
                  feature: 'BRANDING',
                  tier: BRANDING_TIER,
                  surface: PlatformAdminSurface.SAMPLE,
                })
              }
            >
              <Crown />
              {t('Upgrade to save')}
            </Button>
          ),
      }
    : undefined;

  return (
    <Form {...form}>
      <form
        className="flex flex-1 flex-col"
        onSubmit={form.handleSubmit(() => {
          if (previewingLockedBranding && !nameDirty) return;
          updatePlatform();
        })}
      >
        <AdminPage
          width="narrow"
          footer={
            <SaveBar
              width="narrow"
              dirty={previewingLockedBranding ? nameDirty : hasChanges}
              canDiscard={hasChanges}
              saving={isPending}
              disabled={hasFieldErrors}
              status={
                form.formState.errors.root?.serverError ? (
                  <FormMessage>
                    {form.formState.errors.root.serverError.message}
                  </FormMessage>
                ) : undefined
              }
              locked={lockedSave}
              saveLabel={previewingLockedBranding ? t('Save name') : undefined}
              onDiscard={() => {
                form.reset();
                clearImages();
              }}
              saveControl={AdminControl.GENERAL_APPEARANCE_SUBMIT}
            />
          }
        >
          {header}
          <SettingsPanel title={t('Platform')} flush>
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem className="space-y-0">
                  <SettingsRow
                    title={
                      <FormLabel htmlFor="name">{t('Platform Name')}</FormLabel>
                    }
                    description={
                      fieldState.error ? (
                        <FormMessage />
                      ) : (
                        t('Shown in the sidebar, emails and the sign-in page.')
                      )
                    }
                  >
                    <FormControl>
                      <Input
                        {...field}
                        required
                        id="name"
                        placeholder={t('Platform Name')}
                        className="w-64"
                      />
                    </FormControl>
                  </SettingsRow>
                </FormItem>
              )}
            />
          </SettingsPanel>

          <SettingsPanel
            title={t('Branding')}
            description={
              brandingLocked
                ? t(
                    'Try your logo and colors here. The preview is only for you and is not saved until you upgrade.',
                  )
                : t(
                    'Your logo and colors replace ours everywhere, including sign-in and emails.',
                  )
            }
            action={
              brandingLocked ? (
                <Badge variant="info">
                  <Crown />
                  {t('{tier} plan', { tier: tierLabel })}
                </Badge>
              ) : undefined
            }
          >
            {BRAND_IMAGES.map((image) => (
              <BrandImageField
                key={`${image.kind}-${imageFieldsKey}`}
                id={`brand-${image.kind}`}
                label={t(image.title)}
                hint={t(image.hint)}
                wide={image.kind === 'logo'}
                currentUrl={platform[image.urlKey]}
                file={images[image.kind]}
                maxSizeMb={maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB}
                onFileChange={(file) =>
                  setImages((previous) => ({ ...previous, [image.kind]: file }))
                }
              />
            ))}
            <div className="flex flex-col gap-4 border-t border-gray-6 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-12">
                  {t('Colors')}
                </span>
                <span className="text-sm text-gray-11">
                  {t('Your brand and status colors.')}
                </span>
              </div>
              <div className="@container">
                <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <ColorRow
                        tone="primary"
                        label={t('Primary')}
                        color={field.value}
                        defaultColor={brandColors.defaultPrimaryColor()}
                        isDefault={
                          field.value.toLowerCase() ===
                          brandColors.defaultPrimaryColor()
                        }
                        onChange={field.onChange}
                        onReset={() =>
                          field.onChange(brandColors.defaultPrimaryColor())
                        }
                      />
                    )}
                  />
                  {brandColors.statusScales.map((scale) => (
                    <FormField
                      key={scale}
                      control={form.control}
                      name={`statusColors.${scale}`}
                      render={({ field }) => (
                        <ColorRow
                          tone={scale}
                          label={statusLabels[scale]}
                          color={field.value}
                          defaultColor={brandColors.defaultStatusColor({
                            scale,
                          })}
                          isDefault={isNil(field.value)}
                          onChange={field.onChange}
                          onReset={() => field.onChange(undefined)}
                        />
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SettingsPanel>
          {children}
        </AdminPage>
      </form>
    </Form>
  );
};

const ColorRow = ({
  tone,
  label,
  color,
  defaultColor,
  isDefault,
  onChange,
  onReset,
}: ColorRowProps) => {
  const shownColor = color ?? defaultColor;
  return (
    <FormItem className="flex flex-col gap-4 space-y-0 rounded-lg border border-gray-6 p-4">
      <div className="flex items-center gap-3">
        <ColorPicker
          side="top"
          aria-label={label}
          value={shownColor}
          onChange={onChange}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <FormLabel className="font-normal">{label}</FormLabel>
          <span className="text-xs text-gray-11">
            <span className="font-mono uppercase">{shownColor}</span>
            {isDefault && ` · ${t('Default')}`}
          </span>
        </div>
        <Button
          {...adminControl(AdminControl.GENERAL_COLOUR_RESET_RUN)}
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('Reset {name}', { name: label })}
          disabled={isDefault}
          onClick={onReset}
        >
          {t('Reset')}
        </Button>
      </div>
      <FormMessage />
      <ColorPreview tone={tone} />
    </FormItem>
  );
};

function withStatusColors({
  themeColors,
  statusColors,
}: {
  themeColors: PlatformThemeColors | null | undefined;
  statusColors: StatusColors;
}): PlatformThemeColors {
  const hasStatusColor = Object.values(statusColors).some(
    (color) => !isNil(color),
  );
  return {
    ...themeColors,
    status: hasStatusColor ? statusColors : undefined,
  };
}

const PlatformAppearanceSchema = z.object({
  name: z.string().min(1, formErrors.required),
  color: ThemeHexColor,
  statusColors: PlatformThemeColors.shape.status.unwrap(),
});

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;

const BRANDING_TIER = 'enterprise';
const DEFAULT_MAX_FILE_SIZE_MB = 25;
const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';
const EMPTY_IMAGES: BrandImages = { logo: null, icon: null, favicon: null };

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

type BrandImageKind = 'logo' | 'icon' | 'favicon';

type BrandImages = Record<BrandImageKind, File | null>;

type BrandImageSpec = {
  kind: BrandImageKind;
  field: 'fullLogo' | 'logoIcon' | 'favIcon';
  urlKey: 'fullLogoUrl' | 'logoIconUrl' | 'favIconUrl';
  title: string;
  hint: string;
};

type AppearanceSectionProps = {
  header?: ReactNode;
  children?: ReactNode;
};

type ColorRowProps = {
  tone: ColorTone;
  label: string;
  color: string | undefined;
  defaultColor: string;
  isDefault: boolean;
  onChange: (color: string | undefined) => void;
  onReset: () => void;
};
