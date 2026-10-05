import { ApFlagId } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { localesMap } from '@/lib/locale-utils';
import { cn } from '@/lib/utils';

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

  return (
    <div className="flex flex-col gap-2">
      <Label className="gap-2">
        <Globe className="size-4 text-gray-11" />
        {t('Language')}
      </Label>
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-between font-normal',
              !selectedLanguage && 'text-gray-11',
            )}
            disabled={isPending}
          >
            {isPending ? (
              <Spinner />
            ) : selectedLanguage ? (
              localesMap[selectedLanguage as keyof typeof localesMap]
            ) : (
              t('Select language')
            )}
            <ChevronsUpDown className="text-gray-11" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={i18n.t('Search language...')} />
            <CommandList>
              <ScrollArea className="h-[200px] w-[300px]">
                <CommandEmpty>{i18n.t('No language found.')}</CommandEmpty>
                <CommandGroup>
                  {Object.entries(localesMap).map(([value, label]) => (
                    <CommandItem
                      value={value}
                      key={value}
                      onSelect={(value) => mutate(value)}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2">{label}</div>
                      <Check
                        className={cn(
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
      {showCommunity && (
        <Link
          className="w-fit text-xs font-medium text-accent-11 hover:underline"
          rel="noopener noreferrer"
          target="_blank"
          to="https://www.activepieces.com/docs/about/i18n"
        >
          {t('Help translate Activepieces →')}
        </Link>
      )}
    </div>
  );
};
