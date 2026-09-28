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
    return size === 'sm' ? null : <LogoPlate className="size-8 rounded-lg" />;
  }
  return (
    <LogoPlate
      src={info.logoUrl}
      alt={info.name}
      className={size === 'sm' ? 'size-4' : 'size-8 rounded-lg p-2'}
    />
  );
}
