import { ApFlagId } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';
import { localesMap } from '@/lib/locale-utils';
import { cn } from '@/lib/utils';

import { SETTING_TRIGGER_CLASS, SettingRow } from './setting-row';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(
    i18n.language ?? 'en',
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (value: string) => {
      setSelectedLanguage(value);
      return i18n.changeLanguage(value);
    },
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  const languageLabel = selectedLanguage
    ? localesMap[selectedLanguage as keyof typeof localesMap]
    : t('Select language');

  return (
    <SettingRow
      title={t('Language')}
      description={
        showCommunity ? (
          <Link
            className="text-accent-11 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
            to="https://www.activepieces.com/docs/about/i18n"
          >
            {t('Help translate Activepieces →')}
          </Link>
        ) : undefined
      }
    >
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-label={`${t('Language')}, ${languageLabel}`}
            className={cn(
              SETTING_TRIGGER_CLASS,
              !selectedLanguage && 'text-gray-11',
            )}
            disabled={isPending}
          >
            {isPending ? (
              <LoadingSpinner className="size-4" />
            ) : (
              <span className="truncate">{languageLabel}</span>
            )}
            <ChevronsUpDown className="text-gray-11" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="end">
          <Command>
            <CommandInput
              placeholder={i18n.t('Search language...')}
              className="h-8 text-sm"
            />
            <CommandList>
              <ScrollArea className="h-[200px]">
                <CommandEmpty className="py-4 text-center text-sm">
                  {i18n.t('No language found.')}
                </CommandEmpty>
                <CommandGroup>
                  {Object.entries(localesMap).map(([value, label]) => (
                    <CommandItem
                      value={value}
                      key={value}
                      onSelect={(value) => mutate(value)}
                      className="justify-between text-sm"
                    >
                      {label}
                      <Check
                        className={cn(
                          'size-4',
                          value === selectedLanguage
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </SettingRow>
  );
};
