import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { RawWebhookRequest } from '@activepieces/shared';

interface RawWebhookRequestViewerProps {
    rawRequest: RawWebhookRequest;
}

export const RawWebhookRequestViewer: React.FC<RawWebhookRequestViewerProps> = ({ rawRequest }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderSection = (title: string, data: Record<string, string> | any) => (
        <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {title}
            </h4>
            <pre className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md overflow-x-auto text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span className="font-medium text-gray-900 dark:text-white">
                    Raw Webhook Request
                </span>
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
            </button>
            {isExpanded && (
                <div className="p-4 bg-white dark:bg-gray-900">
                    {renderSection('Headers', rawRequest.headers)}
                    {renderSection('Query Parameters', rawRequest.query)}
                    {renderSection('Body', rawRequest.body)}
                </div>
            )}
        </div>
    );
};