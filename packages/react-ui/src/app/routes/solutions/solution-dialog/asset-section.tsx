import { ExternalLink, LucideIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface AssetItemProps {
  id: string;
  name: string;
  icon: LucideIcon;
  onClick: (id: string) => void;
}

export const AssetItem = ({
  id,
  name,
  icon: Icon,
  onClick,
}: AssetItemProps) => {
  return (
    <Button
      variant="ghost"
      className="w-full justify-between h-auto p-3"
      onClick={() => onClick(id)}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{name}</span>
      </div>
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
};

interface AssetSectionProps {
  assets: Array<{ id: string; name: string }>;
  icon: LucideIcon;
  onAssetClick: (id: string) => void;
}

export const AssetSection = ({
  assets,
  icon,
  onAssetClick,
}: AssetSectionProps) => {
  if (!assets || assets.length === 0) return null;

  return (
    <div>
      <div className="space-y-2">
        {assets.map((asset) => (
          <AssetItem
            key={asset.id}
            id={asset.id}
            name={asset.name}
            icon={icon}
            onClick={onAssetClick}
          />
        ))}
      </div>
    </div>
  );
};
