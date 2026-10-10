import { t } from 'i18next';
import { Palette, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { synkraAgencyHooks } from '@/features/synkra-agency';

type BrandingShape = {
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  welcomeMessage?: string;
};

export function BrandingCard({ initial }: { initial: Record<string, unknown> }) {
  const updateBranding = synkraAgencyHooks.useUpdateBranding();

  const [logoUrl, setLogoUrl] = useState<string>((initial.logoUrl as string) ?? '');
  const [primaryColor, setPrimaryColor] = useState<string>(
    (initial.primaryColor as string) ?? '#5DD62C',
  );
  const [supportEmail, setSupportEmail] = useState<string>(
    (initial.supportEmail as string) ?? '',
  );
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    (initial.welcomeMessage as string) ?? '',
  );

  const handleSave = () => {
    const payload: BrandingShape = {
      logoUrl: logoUrl.trim() || undefined,
      primaryColor: primaryColor.trim() || undefined,
      supportEmail: supportEmail.trim() || undefined,
      welcomeMessage: welcomeMessage.trim() || undefined,
    };
    updateBranding.mutate(payload, {
      onSuccess: () => toast.success(t('Branding saved')),
      onError: () => toast.error(t('Could not save branding')),
    });
  };

  return (
    <div className="rounded-lg border bg-white p-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-gray-11" />
        <h2 className="font-medium">{t('White-label branding')}</h2>
      </div>

      <p className="text-sm text-gray-11">
        {t(
          'These settings appear to your clients in their portal. Your agency name replaces Synkra branding where you enable it.',
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="logo-url">{t('Logo URL')}</Label>
          <Input
            id="logo-url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/..."
          />
          <p className="text-xs text-gray-11 mt-1">
            {t('Paste a public image URL. We recommend Cloudinary or a similar CDN.')}
          </p>
          {logoUrl && (
            <div className="mt-3 flex items-center gap-3">
              <div className="text-xs text-gray-11">{t('Preview:')}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0.3';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="primary-color">{t('Primary colour')}</Label>
          <div className="flex gap-2 items-center">
            <input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 rounded border cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#5DD62C"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="support-email">{t('Support email')}</Label>
          <Input
            id="support-email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="support@youragency.co.za"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="welcome-message">{t('Portal welcome message')}</Label>
          <Input
            id="welcome-message"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder={t('Welcome to your automation portal')}
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={updateBranding.isPending}>
          <Save className="h-4 w-4 mr-1" />
          {t('Save branding')}
        </Button>
      </div>
    </div>
  );
}
