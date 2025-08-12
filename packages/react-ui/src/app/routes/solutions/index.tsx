import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { solutions } from './solutions';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { SolutionDialog } from './solution-dialog';

const SolutionsPage = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const templateId = searchParams.get('templateId');
    const selectedSolution = useMemo(() => {
        return solutions.find((_, index) => index.toString() === templateId);
    }, [templateId, solutions]);

    const handleSolutionClick = (index: number) => {
        setSearchParams({ templateId: index.toString() });
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setSearchParams({});
        setIsDialogOpen(false);
    };

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            <DashboardPageHeader
                title={t('Solutions')}
                description={t(
                    'Create and manage your solutions and templates',
                )}
            />
            <div className="flex-1  ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {solutions.map((solution, index) => (
                        <Card
                            key={index}
                            variant="interactive"
                            className="h-fit cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleSolutionClick(index)}
                        >
                            <CardContent className="p-0 gap-0">
                                {solution.thumbnail && (
                                    <ImageWithFallback
                                        src={solution.thumbnail}
                                        alt={solution.name}
                                        className="w-full h-36 object-cover rounded-t-lg"
                                    />
                                )}
                                <div className="p-2">
                                    <div className="flex flex-col gap-2 font-semibold text-sm text-center">
                                        {solution.name}
                                    </div>
                                    <div className="flex flex-col gap-2 text-xs text-center">
                                        {solution.author}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {selectedSolution && (
                <SolutionDialog
                    solution={selectedSolution}
                    open={isDialogOpen}
                    onOpenChange={handleDialogClose}
                />
            )}
        </div>
    );
};

export { SolutionsPage };
