export function TitleWithCount({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <span className="flex items-baseline gap-2">
      {title}
      {count !== undefined && (
        <span className="text-xs font-normal text-gray-11 tabular-nums">
          {count}
        </span>
      )}
    </span>
  );
}
