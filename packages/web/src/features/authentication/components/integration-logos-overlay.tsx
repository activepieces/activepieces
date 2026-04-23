const CLIENTS = [
  {
    name: 'MoneyGram',
    src: 'https://www.activepieces.com/logos/moneygram.svg',
  },
  { name: 'Red Bull', src: 'https://www.activepieces.com/logos/redbull.svg' },
  { name: 'Rakuten', src: 'https://www.activepieces.com/logos/rakuten.svg' },
  { name: 'DocuSign', src: 'https://www.activepieces.com/logos/docusign.svg' },
  {
    name: 'Contentful',
    src: 'https://www.activepieces.com/logos/contentful.svg',
  },
  { name: 'PostHog', src: 'https://www.activepieces.com/logos/posthog.svg' },
  { name: 'Roblox', src: 'https://www.activepieces.com/logos/roblox.svg' },
  { name: 'Alan', src: 'https://www.activepieces.com/logos/alan.svg' },
  {
    name: 'Funding Societies',
    src: 'https://www.activepieces.com/logos/fundingsocieties-sales.png',
  },
  { name: 'Plivo', src: 'https://www.activepieces.com/logos/plivo.svg' },
  { name: 'Nedap', src: 'https://www.activepieces.com/logos/nedap.svg' },
  {
    name: 'Experience.com',
    src: 'https://www.activepieces.com/logos/experience.com.svg',
  },
] as const;

export const IntegrationLogosOverlay = () => {
  return (
    <div className="grid grid-cols-3 gap-x-10 gap-y-8 items-center">
      {CLIENTS.map(({ name, src }) => (
        <img
          key={name}
          src={src}
          alt={name}
          className="h-7 w-auto object-contain"
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ))}
    </div>
  );
};
