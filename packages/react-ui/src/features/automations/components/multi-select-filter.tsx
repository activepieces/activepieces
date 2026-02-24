import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "i18next";
import { Search } from "lucide-react";
import { useState } from "react";

type MultiSelectFilterProps = {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
};

export const MultiSelectFilter = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  searchable = false,
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectedLabels = selectedValues
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  const filteredOptions =
    searchable && search
      ? options.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase()),
        )
      : options;

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-sm gap-2 whitespace-nowrap border-dashed"
        >
          {icon}
          <span>{label}</span>
          {selectedValues.length > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <div className="h-4 w-px bg-border" />
              {selectedValues.length <= 2 ? (
                selectedLabels.map((labelText, idx) => (
                  <Badge
                    key={selectedValues[idx]}
                    variant="outline"
                    className="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                  >
                    {labelText}
                  </Badge>
                ))
              ) : (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                >
                  {selectedValues.length} selected
                </Badge>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {searchable && (
          <div className="px-2 pt-2 pb-1 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('Search...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-7 text-sm border-none shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        )}
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                {t('No results')}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                  onClick={() => toggleValue(option.value)}
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => toggleValue(option.value)}
                  />
                  {option.icon}
                  <span className="text-sm flex-1 truncate">
                    {option.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {selectedValues.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange([])}
            >
              {t('Clear all')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};