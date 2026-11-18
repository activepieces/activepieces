import { LogoPlate } from '@/components/custom/logo-plate';

export function ClientIcon({
  icon,
  className = 'size-8',
}: {
  icon: string;
  className?: string;
}) {
  return (
    <LogoPlate
      src={icon}
      alt=""
      border
      className={className}
      innerClassName="size-3/5 p-0"
      imageClassName="transition-none"
    />
  );
}
