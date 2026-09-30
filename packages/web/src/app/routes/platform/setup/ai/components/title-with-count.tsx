import { Badge } from '@/components/ui/badge';

export function TitleWithCount({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <span className="flex items-center gap-3">
      {title}
      {count !== undefined && (
        <Badge variant="secondary" className="tabular-nums">
          {count}
        </Badge>
      )}
    </span>
  );
}
