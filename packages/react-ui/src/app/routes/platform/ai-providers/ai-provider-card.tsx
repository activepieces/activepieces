import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { t } from "i18next";
import { UpsertAIProviderDialog } from "./upsert-provider-dialog";
import { Button } from "@/components/ui/button";

type AIProviderCardProps = {
    providerName: string;
    providerDescription?: string;
    providerIcon?: React.ReactNode;
    badgesText?: string[];
};

const AIProviderCard = ({
    providerName,
    providerIcon,
    providerDescription,
    badgesText,
}: AIProviderCardProps) => {
    return (
        <Card className="w-full px-4 py-4">
            <div className="flex w-full gap-2 justify-center items-center">
                <div className="flex flex-col gap-2 text-center mr-2">
                    {providerIcon}
                </div>
                <div className="flex flex-grow flex-col">
                    <div className="text-lg">{providerName}</div>
                    <div className="text-sm text-muted-foreground">
                        {providerDescription ??
                            t('Configure credentials for {providerName} AI provider.', {
                                providerName,
                            })}
                    </div>
                    {badgesText && (
                        <div className="mt-2 gap-2 flex">
                            {badgesText.map((text, index) => (
                                <Badge key={index} variant={'outline'}>
                                    {text}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center items-center">
                    <UpsertAIProviderDialog onCreate={() => { }}>
                        <Button variant={'basic'}>Enable</Button>
                    </UpsertAIProviderDialog>
                </div>
            </div>
        </Card>
    );
};

AIProviderCard.displayName = 'AIProviderCard'
export { AIProviderCard };
