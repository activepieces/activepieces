'use client';

import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, localesMap } from '@/lib/utils';
import { ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '../../hooks/flags-hooks';

export function LanguageSwitcher() {
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
    <div className="flex items-center justify-center flex-col gap-2">
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            loading={isPending}
            className={cn(
              'w-[160px] h-[35px] px-2  justify-between ',
              !selectedLanguage && 'text-muted-foreground',
            )}
          >
            {selectedLanguage
              ? localesMap[selectedLanguage as keyof typeof localesMap]
              : t('Select language')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[160px] p-0">
          <Command>
            <CommandInput placeholder={i18n.t('Search language...')} />
            <CommandList>
              <ScrollArea className="h-[300px]">
                <CommandEmpty>{i18n.t('No language found.')}</CommandEmpty>
                <CommandGroup>
                  {Object.entries(localesMap).map(([value, label]) => (
                    <CommandItem
                      value={value}
                      key={value}
                      onSelect={(value) => mutate(value)}
                      className="flex items-center justify-between"
                    >
                      {label}
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
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
        <div>
          <Link
            className=" text-primary text-sm text-muted-foreground"
            rel="noopener noreferrer"
            target="_blank"
            to="https://www.activepieces.com/docs/about/i18n"
          >
            {t('Translate Activepieces')}
          </Link>
        </div>
      )}
    </div>
  );
}
