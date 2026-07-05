import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModel,
  CloudflareGatewayDiscoveryProvider,
  CloudflareGatewayModelFilter,
  CloudflareGatewayProviderConfig,
  ProviderModelConfig,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';

type DiscoverModelsDialogProps = {
  form: UseFormReturn<any>;
  existingModelIds: string[];
  onModelsSelected: (models: ProviderModelConfig[]) => void;
  children: React.ReactNode;
};

const DISCOVERY_PROVIDERS = [
  { value: 'openai' as const, label: 'OpenAI' },
  { value: 'anthropic' as const, label: 'Anthropic' },
  { value: 'google-vertex-ai' as const, label: 'Google Vertex AI' },
];

export const DiscoverModelsDialog = ({
  form,
  existingModelIds,
  onModelsSelected,
  children,
}: DiscoverModelsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [discoveryProvider, setDiscoveryProvider] = useState<string>('openai');
  const [vertexPublisher, setVertexPublisher] = useState('google');
  const [search, setSearch] = useState('');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

  const discoverMutation = useMutation({
    mutationFn: async () => {
      const auth = form.getValues('auth');
      const config = form.getValues('config') as CloudflareGatewayProviderConfig;
      const filter: CloudflareGatewayModelFilter = {};
      if (search.trim()) {
        filter.search = search.trim();
      }
      const discoverPayload = {
        auth,
        config: {
          ...config,
          discovery: {
            provider: discoveryProvider as CloudflareGatewayDiscoveryProvider,
            vertexPublisher: discoveryProvider === 'google-vertex-ai' ? vertexPublisher : undefined,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
          },
        },
      };
      return aiProviderApi.discoverModels('cloudflare-gateway', discoverPayload);
    },
  });

  const discoveredModels: AIProviderModel[] = discoverMutation.data ?? [];

  // Reset stale results whenever discovery parameters change
  useEffect(() => {
    if (discoverMutation.data) {
      discoverMutation.reset();
    }
    setSelectedModels(new Set());
  }, [discoveryProvider, vertexPublisher, search]);

  const handleDiscover = () => {
    setSelectedModels(new Set());
    discoverMutation.mutate();
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const existingSet = new Set(existingModelIds);
    const modelsToAdd: ProviderModelConfig[] = discoveredModels
      .filter((m) => selectedModels.has(m.id) && !existingSet.has(m.id))
      .map((m) => ({
        modelId: m.id,
        modelName: m.name,
        modelType: m.type,
      }));
    onModelsSelected(modelsToAdd);
    setOpen(false);
    discoverMutation.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Discover Models')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-provider">{t('Provider')}</Label>
            <Select
              value={discoveryProvider}
              onValueChange={setDiscoveryProvider}
            >
              <SelectTrigger id="sub-provider">
                <SelectValue placeholder={t('Select provider')} />
              </SelectTrigger>
              <SelectContent>
                {DISCOVERY_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {discoveryProvider === 'google-vertex-ai' && (
            <div className="space-y-2">
              <Label htmlFor="vertex-publisher">{t('Vertex Publisher')}</Label>
              <Input
                id="vertex-publisher"
                value={vertexPublisher}
                onChange={(e) => setVertexPublisher(e.target.value)}
                placeholder="google"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="search-filter">{t('Search Filter')}</Label>
            <div className="flex gap-2">
              <Input
                id="search-filter"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Filter by model name...')}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDiscover}
                disabled={discoverMutation.isPending}
              >
                {discoverMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {discoverMutation.isError && (
            <p className="text-sm text-destructive">
              {discoverMutation.error instanceof Error
                ? discoverMutation.error.message
                : t('Failed to discover models')}
            </p>
          )}

          {discoveredModels.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
              {discoveredModels.map((model) => (
                <label
                  key={model.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selectedModels.has(model.id)}
                    onCheckedChange={() => toggleModel(model.id)}
                  />
                  <div className="flex flex-col gap-0">
                    <span className="text-sm font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.id}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {discoverMutation.isSuccess && discoveredModels.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('No models found. Try a different provider or adjust filters.')}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedModels.size === 0}
          >
            {t('Add {count} model(s)', { count: selectedModels.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
