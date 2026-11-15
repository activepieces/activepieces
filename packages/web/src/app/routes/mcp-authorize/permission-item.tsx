export function PermissionItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-gray-2 px-3 py-2.5 text-sm">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-3">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}
