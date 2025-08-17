import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { ConnectionSelectFromName } from '../../../connections/connection-select-from-name';
import { SolutionConnectionFormData } from '.';
import { SolutionWithMetadata } from '../solutions';

interface ConfigureScreenProps {
  solution: SolutionWithMetadata;
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


    </div>
  );
};

export { ConfigureScreen };
