import { AiProviderInfo } from '@/features/agents';

export function ProviderLogo({
  info,
  size = 'md',
}: {
  info: AiProviderInfo;
  size?: 'sm' | 'md';
}) {
  if (size === 'sm') {
    return info.logoUrl ? (
      <img
        src={info.logoUrl}
        alt={info.name}
        className="size-4 shrink-0 object-contain"
      />
    ) : null;
  }
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
      {info.logoUrl && (
        <img
          src={info.logoUrl}
          alt={info.name}
          className="size-4 object-contain"
        />
      )}
    </div>
  );
}
