import { t } from 'i18next';
import { CheckCircle2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { solutions } from '../solutions';
import { ConnectionSelectFromName } from '../../../connections/connection-select-from-name';
import { SolutionConnectionFormData } from '.';

interface ConfigureScreenProps {
  solution: (typeof solutions)[0];
}

const ConfigureScreen = ({ solution }: ConfigureScreenProps) => {
  const connections = solution.state.connections ?? [];
  const form = useFormContext<SolutionConnectionFormData>();

  const handleConnectionChange = (
    connectionExternalId: string,
    selectedConnectionId: string | null,
  ) => {
    form.setValue(connectionExternalId, selectedConnectionId);
    form.clearErrors(connectionExternalId);
  };

  return (
    <div className="flex-1 px-6">
      <p className="text-muted-foreground text-sm">
        {t("Let's connect your accounts to clone the solution.")}
      </p>

      <form className="space-y-4 max-w-lg">
        {connections.map((connection, index) => {
          return (
            <FormField
              key={index}
              control={form.control}
              name={connection.externalId}
              rules={{ required: t('Please select a connection') }}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-center gap-6 pt-3 ">
                    <div className="flex items-center gap-2">
                      <PieceIconWithPieceName
                        pieceName={connection.pieceName}
                        size="sm"
                        circle={false}
                      />

                      <div className="text-base  min-w-0 flex-shrink-0">
                        {connection.displayName}
                      </div>
                    </div>
                    <div className="flex-1">
                      <FormControl>
                        <ConnectionSelectFromName
                          pieceName={connection.pieceName}
                          value={field.value}
                          onChange={(selectedConnectionId) =>
                            handleConnectionChange(
                              connection.externalId,
                              selectedConnectionId,
                            )
                          }
                        />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </form>

      {connections.length === 0 && (
        <div className="px-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p className="font-medium">{t('No connections required')}</p>
                <p className="text-sm">
                  {t(
                    'This solution is ready to use without any additional setup.',
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { ConfigureScreen };
