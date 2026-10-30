import { LogoPlate } from '@/components/custom/logo-plate';
import { AiProviderInfo } from '@/features/agents';

export function ProviderLogo({
  info,
  size = 'md',
}: {
  info: AiProviderInfo;
  size?: 'sm' | 'md';
}) {
  if (!info.logoUrl) {
    return size === 'sm' ? null : (
      <div className="size-9 shrink-0 rounded-lg bg-gray-3" />
    );
  }
  return (
    <LogoPlate
      src={info.logoUrl}
      alt={info.name}
      size={size === 'sm' ? undefined : 'md'}
      className={size === 'sm' ? 'size-4' : 'rounded-lg'}
    />
  );
}
