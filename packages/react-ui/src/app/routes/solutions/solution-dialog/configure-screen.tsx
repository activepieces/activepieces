import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { solutions } from '../solutions';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { isNil } from '@activepieces/shared';
import { ConnectionDropdown } from '../../mcp-servers/id/mcp-piece-tool-dialog/connection-dropdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { t } from 'i18next';

interface ConfigureScreenProps {
    solution: typeof solutions[0];
}

type ConnectionFormData = {
    [key: string]: string | null;
};

const ConnectionSelectFromName = ({
    pieceName,
    value,
    onChange
}: {
    pieceName: string;
    value: string | null;
    onChange: (connectionExternalId: string | null) => void;
}) => {
    const { pieceModel, isLoading } = piecesHooks.usePiece({
        name: pieceName,
    });

    if (isNil(pieceModel) || isLoading) {
        return null;
    }

    return <div className="flex w-full">
        <ConnectionDropdown
            piece={pieceModel}
            value={value}
            onChange={onChange}
            placeholder="Select a connection"
            showLabel={false}
            required={true}
            showError={false}
        />
    </div>
}

const ConfigureScreen = ({ solution }: ConfigureScreenProps) => {

    const connections = solution.state.connections ?? [];

    const initialFormData: ConnectionFormData = connections.reduce((acc, connection) => {
        acc[connection.externalId] = null;
        return acc;
    }, {} as ConnectionFormData);

    const form = useForm<ConnectionFormData>({
        defaultValues: initialFormData,
    });

    const handleConnectionChange = (connectionExternalId: string, selectedConnectionId: string | null) => {
        form.setValue(connectionExternalId, selectedConnectionId);
    };


    return (
        <div className="flex-1 px-6">
            <p className="text-muted-foreground text-sm">
                {t('Let\'s connect your accounts to clone the solution.')}
            </p>

            <Form {...form}>
                <form className="space-y-4 max-w-lg">
                    {connections.map((connection, index) => {
                        return (
                            <div key={index} className="flex items-center justify-center gap-6 py-3">
                                <div className="flex items-center gap-2">
                                    <PieceIconWithPieceName pieceName={connection.pieceName} size="sm" circle={false} />

                                    <div className="text-base  min-w-0 flex-shrink-0">
                                        {connection.displayName}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <ConnectionSelectFromName
                                        pieceName={connection.pieceName}
                                        value={form.watch(connection.externalId)}
                                        onChange={(selectedConnectionId) =>
                                            handleConnectionChange(connection.externalId, selectedConnectionId)
                                        }
                                    />
                                </div>
                            </div>
                        );
                    })}
                </form>
            </Form>

            {connections.length === 0 && (
                <div className="px-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center text-muted-foreground">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                                <p className="font-medium">{t('No connections required')}</p>
                                <p className="text-sm">{t('This solution is ready to use without any additional setup.')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export { ConfigureScreen };
