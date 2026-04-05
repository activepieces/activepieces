import React from 'react';
import { useFlowRun } from '../hooks/use-flow-run';
import { StepLog } from '../components/step-log/step-log';
import { RawWebhookRequestViewer } from '../components/step-log/raw-webhook-request-viewer';

export const FlowRunPage: React.FC = () => {
    const { flowRun, isLoading, error } = useFlowRun();

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;
    if (!flowRun) return <div className="p-8">Flow run not found</div>;

    const triggerStep = Object.values(flowRun.steps).find((step: any) => step.type === 'TRIGGER');
    const nonTriggerSteps = Object.entries(flowRun.steps).filter(([_, step]) => step.type !== 'TRIGGER');
    const hasRawWebhookData = flowRun.triggerEvent?.rawRequest;

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Flow Run: {flowRun.id}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Status: {flowRun.status} | Started: {new Date(flowRun.startTime).toLocaleString()}
                </p>
            </div>

            <div className="space-y-6">
                {triggerStep && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Trigger Step
                        </h2>
                        <StepLog step={triggerStep} />
                        
                        {hasRawWebhookData && flowRun.triggerEvent && (
                            <div className="mt-6">
                                <RawWebhookRequestViewer 
                                    rawRequest={flowRun.triggerEvent.rawRequest!} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {nonTriggerSteps.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            All Steps
                        </h2>
                        <div className="space-y-4">
                            {nonTriggerSteps.map(([stepName, step]: [string, any]) => (
                                <div key={stepName} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                        {stepName}
                                    </h3>
                                    <StepLog step={step} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
```