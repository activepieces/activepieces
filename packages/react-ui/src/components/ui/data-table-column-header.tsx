import { Column } from "@tanstack/react-table"


interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}
 
export function DataTableColumnHeader<TData, TValue>({
    title,
    className,
  }: DataTableColumnHeaderProps<TData, TValue>) {
    return (
      <div
        className={`ap-flex ap-items-center ap-justify-between ap-space-x-2 ap-py-4 ${className}`}
      >
        <div className="ap-text-sm ap-text-black ap-font-semibold">{title}</div>
      </div>
    )
}