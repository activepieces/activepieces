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
import { LoadingSpinner } from '@/components/ui/spinner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn, localesMap } from '@/lib/utils';
import { ApFlagId } from '@activepieces/shared';

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
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Globe className="w-4 h-4" />
        {t('Language')}
      </Label>
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-between h-9',
              !selectedLanguage && 'text-muted-foreground',
            )}
            disabled={isPending}
          >
            {isPending ? (
              <LoadingSpinner className="w-4 h-4" />
            ) : selectedLanguage ? (
              localesMap[selectedLanguage as keyof typeof localesMap]
            ) : (
              t('Select language')
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={i18n.t('Search language...')}
              className="h-9 text-sm"
            />
            <CommandList>
              <ScrollArea className="h-[200px] w-[300px]">
                <CommandEmpty className="py-4 text-center text-sm">
                  {i18n.t('No language found.')}
                </CommandEmpty>
                <CommandGroup>
                  {Object.entries(localesMap).map(([value, label]) => (
                    <CommandItem
                      value={value}
                      key={value}
                      onSelect={(value) => mutate(value)}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {label}
                      </div>
                      <Check
                        className={cn(
                          'h-4 w-4',
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
        <div className="pt-1">
          <Link
            className="text-xs text-primary hover:underline font-medium"
            rel="noopener noreferrer"
            target="_blank"
            to="https://www.activepieces.com/docs/about/i18n"
          >
            {t('Help translate Activepieces →')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;
