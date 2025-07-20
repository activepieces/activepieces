import { cn } from "@/lib/utils";
import { CardListItem } from "./card-list";

const RadioGroupList = <T extends unknown>({
    items,
    onChange,
    value,
    onHover,
    className,
}: {
    items: {
        label: string;
        value: T;
        labelExtra?: React.ReactNode;
        description?: string;
    }[];
    onChange: (value: T) => void;
    value: T | null;
    onHover?: (value: T | null) => void;
    className?: string;
}) => {
    return (
      <div className={cn("space-y-4", className)}>
          {items.map((item)=>{
        const selected = item.value === value
         return  <CardListItem
            className={cn(
              `p-4 rounded-lg border  block hover:border-primary/50 hover:bg-muted/50`,
              item.value === value && 'border-primary bg-primary/5',
            )}
            onClick={() => onChange(item.value)}
            onMouseEnter={() => onHover && onHover(item.value)}
            onMouseLeave={() => onHover && onHover(null)}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium flex items-center gap-2">
                {item.label}
                {item.labelExtra}
              </h4>
              <div className="flex-shrink-0 w-5 h-5">
                <div
                  className={cn(
                    `w-5 h-5 rounded-full grid place-items-center border border-muted-foreground`,
                    selected && 'border-primary',
                  )}
                >
                  {selected && (
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </CardListItem>
        })}
      </div>
      
       )
}


RadioGroupList.displayName = 'RadioGroupList';
export { RadioGroupList };