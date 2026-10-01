import { LogoPlate } from '@/components/custom/logo-plate';
import { AiProviderInfo } from '@/features/agents';

export function ProviderLogo({
  info,
  size = 'md',
}: {
  info: AiProviderInfo;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (size === 'sm') {
    return info.logoUrl ? (
      <LogoPlate src={info.logoUrl} alt={info.name} size="xxs" />
    ) : null;
  }
  return (
    <LogoPlate
      src={info.logoUrl || undefined}
      alt={info.name}
      size={size === 'lg' ? 'lg' : 'xs'}
      border
      className={size === 'lg' ? 'rounded-xl' : undefined}
    />
  );
}
