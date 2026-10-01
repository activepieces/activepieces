export function PermissionItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-12">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-3 text-accent-11 [&_svg]:size-4">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}
