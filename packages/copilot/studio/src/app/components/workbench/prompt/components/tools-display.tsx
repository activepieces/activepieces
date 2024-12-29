import { cn } from "../../../../../lib/utils";

interface Tool {
  name: string;
  function: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

interface ToolsDisplayProps {
  tools: Tool[];
  className?: string;
}

export const ToolsDisplay = ({
  tools,
  className
}: ToolsDisplayProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Available Tools</h3>
          <div className="flex items-center">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {tools?.length || 0} tools
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tools?.map((tool, index) => (
          <div
            key={`${tool.name}-${index}`}
            className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2"
          >
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-gray-900">{tool.name}</h4>
            </div>
            
            <p className="text-sm text-gray-600">{tool.description}</p>

            {tool.parameters?.properties && Object.keys(tool.parameters.properties).length > 0 && (
              <div className="mt-2 space-y-1.5">
                <h5 className="text-xs font-medium text-gray-700">Parameters:</h5>
                <div className="space-y-1">
                  {Object.entries(tool.parameters.properties).map(([paramName, param]) => (
                    <div key={paramName} className="flex items-start gap-2 text-xs">
                      <span className="font-medium text-gray-700">{paramName}</span>
                      <span className="text-gray-500">({(param as any).type})</span>
                      {tool.parameters.required?.includes(paramName) && (
                        <span className="text-red-500">*</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 