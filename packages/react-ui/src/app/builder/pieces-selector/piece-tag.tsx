import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const tagVariants = cva(
  'text-xs font-semibold me-2 px-2.5 py-0.5 rounded-full cursor-pointer border border-transparent dark:border-[2px]',
  {
    variants: {
      variant: {
        pink: 'bg-pink-50 text-pink-800 hover:border-pink-400 data-[selected=true]:border-pink-400',
        yellow:
          'bg-yellow-50 text-yellow-800 hover:border-yellow-400 data-[selected=true]:border-yellow-400',
        purple:
          'bg-purple-50 text-purple-800 hover:border-purple-400 data-[selected=true]:border-purple-400',
        blue: 'bg-blue-50 text-blue-800 hover:border-blue-400 data-[selected=true]:border-blue-400',
        green:
          'bg-green-50 text-green-800 hover:border-green-400 data-[selected=true]:border-green-400',
      },
    },
  },
);

export interface PieceTagProps extends VariantProps<typeof tagVariants> {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
}

const PieceTag = ({ variant, children, selected, onClick }: PieceTagProps) => {
  return (
    <span
      className={cn(tagVariants({ variant }))}
      data-selected={selected}
      onClick={onClick}
    >
      {children}
    </span>
  );
};

PieceTag.displayName = 'PieceTag';
export { PieceTag };
