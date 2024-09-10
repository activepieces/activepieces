import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { AIProviderCard } from './ai-provider-card';

export default function AIProvidersPage() {

  return (
    <div className="flex flex-col w-full">
      <div className="mb-4 flex">
        <div className="flex justify-between flex-row w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold w-full">
              {t('AI Providers')}
            </h1>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">

        <AIProviderCard providerName="OpenAI" providerIcon={
          <img src="https://cdn.activepieces.com/pieces/openai.png" alt="icon" width={32} height={32} />
        } ></AIProviderCard>
        <AIProviderCard providerName="Anthropic" providerIcon={
          <img src="https://cdn.activepieces.com/pieces/claude.png" alt="icon" width={32} height={32} />
        } ></AIProviderCard>
      </div>
    </div>
  );
}
