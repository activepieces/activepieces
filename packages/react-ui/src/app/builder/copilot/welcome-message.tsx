import { Bot, Code2, FileJson, Calculator, Globe } from 'lucide-react';
import { CopilotMessage } from './chat-message';
import { t } from 'i18next';

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
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
            </p>
        </div>
    </div>
);

export const WelcomeMessage = ({ message }: WelcomeMessageProps) => {
    if (message.messageType !== 'text' || !message.content || message.content !== 'welcome') return null;

    return (
        <div className="flex w-full gap-3 animate-in fade-in slide-in-from-left-5 ">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm">
                <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Ready to streamline your automation workflow with intelligent code generation.
                        </p>
                        <div className="space-y-1.5">
                            <FeatureItem
                                icon={<FileJson className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
                                title={t("Smart Text Processing")}
                                description={t("Transform and manipulate strings, dates, and data with precision")}
                            />
                            <FeatureItem
                                icon={<Code2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                                title={t("Data Operations")}
                                description={t("Process arrays and objects with powerful transformation tools")}
                            />
                            <FeatureItem
                                icon={<Calculator className="w-4 h-4 text-green-500 dark:text-green-400" />}
                                title={t("Advanced Calculations")}
                                description={t("Handle complex mathematical and statistical operations")}
                            />
                            <FeatureItem
                                icon={<Globe className="w-4 h-4 text-violet-500 dark:text-violet-400" />}
                                title={t("Simple API Integration")}
                                description={t("Connect with third party services. I am currenty great for simple integrations and I will be improving to do more complex integrations in the future!")}
                            />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-gray-800">
                           {t("How can I help optimize your workflow today?")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}; 