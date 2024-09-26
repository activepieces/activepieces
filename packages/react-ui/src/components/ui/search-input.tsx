import { Search } from 'lucide-react';
import * as React from 'react';

export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="flex-grow flex  items-center gap-2 w-full rounded-md border border-input bg-background px-3   ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1 first:disabled:cursor-not-allowed first:disabled:opacity-50 box-border">
        <Search className="size-4 shrink-0 opacity-50"></Search>
        <input
          className="rounded-md bg-transparent  h-8 grow text-sm outline-none placeholder:text-muted-foreground"
          type={type}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
