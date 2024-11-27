import { t } from 'i18next';

import { LanguageSwitcher } from '@/app/routes/settings/appearance/language-switcher';
import { useTheme } from '@/components/theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: 'dark' | 'light') => {
    setTheme(value);
  };

  return (
    <div className="flex flex-col items-center  gap-4">
      <div className="space-y-6 w-full">
        <div>
          <h3 className="text-xl font-semibold">{t('Appearance')}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              'Customize the appearance of the app. Automatically switch between day and night themes.',
            )}
          </p>
        </div>
        <Separator />
        <div className="space-y-8">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              {t('Select the theme for the dashboard.')}
            </div>
            <RadioGroup
              onValueChange={handleThemeChange}
              defaultValue={theme}
              className="grid max-w-md grid-cols-2 gap-8 pt-2"
            >
              <label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="light" className="sr-only" />
                <div
                  className="items-center rounded-md border-2 border-muted p-1 hover:border-accent"
                  onClick={() => handleThemeChange('light')}
                >
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="size-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="size-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  {t('Light')}
                </span>
              </label>
              <label className="[&:has([data-state=checked])>div]:border-primary">
                <RadioGroupItem value="dark" className="sr-only" />
                <div
                  className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="size-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="size-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  {t('Dark')}
                </span>
              </label>
            </RadioGroup>
          </div>
        </div>
        <Separator />
        <LanguageSwitcher></LanguageSwitcher>
      </div>
    </div>
  );
}
