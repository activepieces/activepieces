import { userHooks } from '@/hooks/user-hooks';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { ArrowRight, MapPin, CheckCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { solutions, SolutionWithMetadata } from '../solutions/solutions';
import { SolutionDialog } from '../solutions/solution-dialog';
import { t } from 'i18next';

const OnboardingPage = () => {
    const currentUser = userHooks.useCurrentUser();
    const [selectedSolution, setSelectedSolution] = useState<SolutionWithMetadata | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSolutionClick = (solution: SolutionWithMetadata) => {
        setSelectedSolution(solution);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setSelectedSolution(null);
        setIsDialogOpen(false);
    };

    if (!currentUser.data) {
        return null;
    }

    return (
        <ScrollArea >
            <div className="flex flex-col items-center justify-center p-6">
                <div className="max-w-4xl w-full">
                    {/* Welcome Header */}
                    <div className="text-center mb-12 mt-12">
                        <h1 className="text-4xl font-bold mb-2">
                            {t(`Welcome, ${currentUser.data.firstName}! 👋`)}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('Hire one of the following AI Agents to get started.')}
                        </p>
                    </div>

                    {/* Character Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        {solutions.map((solution, index) => (
                            <Card
                                key={index}
                                variant="interactive"
                                className="p-6 rounded-lg relative hover:shadow-lg transition-all duration-200 bg-white cursor-pointer"
                                onClick={() => handleSolutionClick(solution)}
                            >
                                {/* Available Badge - Top Right */}
                                <div className="absolute top-2 right-2">
                                    <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-300">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>{t('Available')}</span>
                                    </div>
                                </div>

                                {/* Character Image */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-white">
                                        <img
                                            src={solution.thumbnail}
                                            alt={solution.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Character Info */}
                                <div className="text-center">
                                    <h3 className="text-xl font-bold mb-1">
                                        {solution.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4" />
                                        <span>{solution.location}</span>
                                    </div>  
                                    <p className="text-sm mb-4 mt-6">
                                        {solution.greeting}
                                    </p>
                                    {/* Separator */}
                                    <div className="border-t border-gray-200 mb-4"></div>

                                    {/* Hire Me */}
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSolutionClick(solution);
                                        }}
                                    >
                                        <Users className="w-4 h-4" />
                                        {t('Hire Now')}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Skip and Clone Later */}
                    <div className="text-center">
                        <Link
                            to="/flows"
                            className="flex items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        >
                            <span>{t('I\'ll explore on my own')}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {selectedSolution && (
                <SolutionDialog
                    solution={selectedSolution}
                    open={isDialogOpen}
                    onOpenChange={handleDialogClose}
                />
            )}
        </ScrollArea>
    );
};

export { OnboardingPage }; 