export function PermissionItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-accent/50 px-3 py-2.5 text-sm">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}
