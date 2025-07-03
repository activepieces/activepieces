import { t } from 'i18next';
import { Bot, Code2, FileJson, Calculator, Globe } from 'lucide-react';

import magic from '@/assets/img/custom/magic.png';

import { CopilotMessage } from './chat-message';

interface WelcomeMessageProps {
  message: CopilotMessage;
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
  <div className="flex items-center gap-2.5 p-2 rounded-lg  transition-all duration-300 group">
    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-gray-50 dark:bg-gray-800  transition-all duration-300 ease-out">
      {icon}
    </div>
    <div className="transition-all duration-300 ease-out ">
      <h3 className="text-sm font-medium text-black dark:text-gray-100">
        {title}
      </h3>
      <p className="text-xs dark:text-gray-400">{description}</p>
    </div>
  </div>
);

export const WelcomeMessage = ({ message }: WelcomeMessageProps) => {
  if (
    message.messageType !== 'text' ||
    !message.content ||
    message.content !== 'welcome'
  )
    return null;

  return (
    <div className="flex w-full gap-3 animate-in fade-in slide-in-from-left-5 ">
      <div className="min-w-8 min-h-8 max-h-8 max-w-8 border rounded-full border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <Bot className="h-6 w-6 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-1 space-y-4 mt-2">
        <div className="text-sm text-black   ">
          {t(
            'Hello there! I am here to generate code that helps with your flow',
          )}{' '}
          <img src={magic} className="min-w-4 h-4 object-fit inline" />
        </div>
        <p className="text-sm text-black   ">
          {t('Here are examples of what I am best used for: ')}
        </p>
        <div className="space-y-1.5">
          <FeatureItem
            icon={
              <FileJson className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            }
            title={t('Text Processing')}
            description={t('Process strings, dates and data')}
          />
          <FeatureItem
            icon={
              <Code2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            }
            title={t('Data Operations')}
            description={t('Change data from one format to another')}
          />
          <FeatureItem
            icon={
              <Calculator className="w-4 h-4 text-green-500 dark:text-green-400" />
            }
            title={t('Calculations')}
            description={t('Handle math and statistics')}
          />
          <FeatureItem
            icon={
              <Globe className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            }
            title={t('API Integration')}
            description={t(
              'Connect with external services. Best for simple integrations currently.',
            )}
          />
        </div>
        <p className="text-sm text-foreground pt-2">
          {t('What would you like me to help you with?')}
        </p>
      </div>
    </div>
  );
};
