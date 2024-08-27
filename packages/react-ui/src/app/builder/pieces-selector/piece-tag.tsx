export interface PieceTagProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
}

const PieceTag = ({ children, selected, onClick }: PieceTagProps) => {
  return (
    <span
      className="text-sm font-semibold border border-solid   data-[selected=true]:border-primary-300 px-2.5 py-1 rounded-full cursor-pointer bg-primary-100/80 text-primary-300 hover:bg-primary-100/80 hover:border-primary-300 hover:text-primary-300"
      data-selected={selected}
      onClick={onClick}
    >
      {children}
    </span>
  );
};

PieceTag.displayName = 'PieceTag';
export { PieceTag };
