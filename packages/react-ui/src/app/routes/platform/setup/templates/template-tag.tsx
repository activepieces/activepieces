import { t } from 'i18next';
import { XIcon } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  TemplateTags,
  ColorName,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';

type TemplateTagProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: ReadonlyArray<TemplateTags>;
  onChange: (value: ReadonlyArray<TemplateTags>) => void;
};

const formatColorName = (colorName: string): string => {
  return colorName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const TemplateTag = forwardRef<HTMLInputElement, TemplateTagProps>((props) => {
  const { className, value = [], onChange } = props;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [newTagTitle, setNewTagTitle] = useState('');
  const [newTagColor, setNewTagColor] = useState<ColorName>(ColorName.BLUE);
  const [newTagIcon, setNewTagIcon] = useState('');

  const addNewTag = () => {
    const trimmedTitle = newTagTitle.trim();
    if (trimmedTitle) {
      const existingTag = value.find((tag) => tag.title === trimmedTitle);
      if (!existingTag) {
        const newTag: TemplateTags = {
          title: trimmedTitle,
          color: newTagColor,
          icon: newTagIcon.trim() || undefined,
        };
        onChange([...value, newTag]);
      }
      setNewTagTitle('');
      setNewTagColor(ColorName.BLUE);
      setNewTagIcon('');
      setIsPopoverOpen(false);
    }
  };

  const removeTag = (tagToRemove: TemplateTags) => {
    onChange(value.filter((tag) => tag.title !== tagToRemove.title));
  };

  return (
    <div
      className={cn(
        'border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 flex min-h-10 w-full flex-wrap gap-2 rounded-md border bg-white px-3 py-2 text-sm',
        className,
      )}
    >
      {value.map((tag) => {
        const colorPalette = PROJECT_COLOR_PALETTE[tag.color];
        return (
          <Badge
            key={tag.title}
            variant={'accent'}
            style={{
              backgroundColor: colorPalette.color,
              color: colorPalette.textColor,
            }}
          >
            {tag.icon && <span className="mr-1">{tag.icon}</span>}
            <span className="text-xs font-medium">{tag.title}</span>
            <Button
              variant={'ghost'}
              size={'icon'}
              className={'ml-2 h-3 w-3 hover:bg-black/10'}
              onClick={() => removeTag(tag)}
              style={{ color: colorPalette.textColor }}
            >
              <XIcon className={'w-3'} />
            </Button>
          </Badge>
        );
      })}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
          >
            + {t('Add Tag')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">{t('Add New Tag')}</h4>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-1">
                <Label htmlFor="tag-title">{t('Title')}</Label>
                <Input
                  id="tag-title"
                  value={newTagTitle}
                  onChange={(e) => setNewTagTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addNewTag();
                    }
                  }}
                  placeholder={t('Enter tag title')}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="tag-color">{t('Color')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PROJECT_COLOR_PALETTE).map(
                    ([colorName, colorValue]) => (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => setNewTagColor(colorName as ColorName)}
                        className={cn(
                          'h-8 rounded-md border-2 transition-all',
                          newTagColor === colorName
                            ? 'border-neutral-950 dark:border-neutral-50 scale-110'
                            : 'border-transparent hover:scale-105',
                        )}
                        style={{ backgroundColor: colorValue.color }}
                        title={formatColorName(colorName)}
                      >
                        <span className="sr-only">
                          {formatColorName(colorName)}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
              <Button variant="default" onClick={addNewTag} className="w-full">
                {t('Add')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

TemplateTag.displayName = 'TemplateTag';

export { TemplateTag };
