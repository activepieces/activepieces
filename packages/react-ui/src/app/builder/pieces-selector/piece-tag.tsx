import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const tagVariants = cva(
  'text-xs font-semibold me-2 px-2.5 py-0.5 rounded-full cursor-pointer',
  {
    variants: {
      variant: {
        pink: 'bg-pink-100 text-pink-800 hover:bg-pink-300 data-[selected=true]:bg-pink-300',
        yellow:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-300 data-[selected=true]:bg-yellow-300',
        purple:
          'bg-purple-100 text-purple-800 hover:bg-purple-300 data-[selected=true]:bg-purple-300',
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
