export function SectionHeader({
  title,
  count,
  description,
}: {
  title: string;
  count?: number;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
