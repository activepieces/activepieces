    "use client";

    import * as React from "react";
    import * as ProgressPrimitive from "@radix-ui/react-progress";

    interface ProgressProps
        extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
        value: number;
        limit: number;
    }

    const Progress = React.forwardRef<
        React.ElementRef<typeof ProgressPrimitive.Root>,
        ProgressProps
    >(({ value, limit, ...props }, ref) => {
        const percentage = Math.min((value / limit) * 74, 74); 

        return (
            <div className="relative w-full">
                <ProgressPrimitive.Root
                    ref={ref}
                    className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200"
                    {...props}
                >
                    <ProgressPrimitive.Indicator
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${percentage}%` }}
                    />
                </ProgressPrimitive.Root>

                <div className="absolute -top-6 left-0 text-sm text-gray-500">
                    {value}
                </div>

                <div
                    className="absolute text-sm text-gray-400"
                    style={{ left: '75%', top: '-2.5rem' }}
                >
                    Billing Limit
                    <br />
                    {limit.toLocaleString()}
                </div>

                <div
                    className="absolute h-10 -top-10 w-0.5 bg-gray-200"
                    style={{ left: '74%' }}
                />
            </div>
        );
    });

    Progress.displayName = ProgressPrimitive.Root.displayName;

    export { Progress };