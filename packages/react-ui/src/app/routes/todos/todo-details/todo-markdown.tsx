import { ApMarkdown } from "@/components/custom/markdown";
import { MarkdownVariant } from "@activepieces/shared";
import { todoMarkdownParser } from "./todo-markdown-parser";
import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Loader2 } from "lucide-react";

interface TodoMarkdownProps {
    content: string;
}

export const TodoMarkdown = ({ content }: TodoMarkdownProps) => {
    const blocks = todoMarkdownParser.parse(content);
    const [expandedBlocks, setExpandedBlocks] = useState<{ [key: number]: boolean }>({});

    const toggleBlock = (index: number) => {
        setExpandedBlocks(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div className="space-y-4">
            {blocks.map((block, index) => {
                if (block.type === 'text') {
                    return (
                        <div key={index} className="prose prose-sm max-w-none">
                            <ApMarkdown markdown={block.text} variant={MarkdownVariant.BORDERLESS} />
                        </div>
                    );
                }

                const isExpanded = expandedBlocks[index];
                const isDone = block.status === 'done';

                return (
                    <div key={index} className="rounded-lg border border-border overflow-hidden">
                        <button
                            className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
                            onClick={() => toggleBlock(index)}
                        >
                            {isDone ? (
                                <Check className="h-4 w-4 text-success shrink-0" />
                            ) : (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            )}
                            <span className="text-sm font-medium flex-1 text-left">
                                {block.toolName}
                            </span>
                            {isExpanded ? 
                                <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            }
                        </button>

                        {isExpanded && (
                            <div className="border-border p-4 space-y-3">
                                <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Arguments</div>
                                    <pre className="text-xs bg-muted/50 p-3 rounded-md whitespace-pre-wrap break-all">
                                        {JSON.stringify(block.args, null, 2)}
                                    </pre>
                                </div>

                                {block.result && (
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground">Result</div>
                                        <div className="bg-muted/50 p-3 rounded-md">
                                            <ApMarkdown markdown={block.result} variant={MarkdownVariant.BORDERLESS} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};