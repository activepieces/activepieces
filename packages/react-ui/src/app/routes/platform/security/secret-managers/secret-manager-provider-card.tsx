import { Card } from "@/components/ui/card"
import { t } from "i18next"
import { SecretManagerProviderMetaData } from "@activepieces/shared"
import ConnectSecretManagerDialog from "./connect-secret-manager-dialog"
import { Button } from "@/components/ui/button"

type SecretManagerProviderCardProps = {
  provider: SecretManagerProviderMetaData
}

const SecretManagerProviderCard = ({
  provider
}: SecretManagerProviderCardProps) => {
  return (
    <Card className="w-full flex justify-between items-center px-4 py-4">
      <div className="flex gap-8 items-center">
        <img className='w-10' src={provider.logo} alt={provider.name} />
        <div>
          <div className='text-lg'>{provider.name}</div>
          <div className='text-sm text-muted-foreground'>
            {t('Configure credentials for {managerName} secret manager.', {
              managerName: provider.name,
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <ConnectSecretManagerDialog manager={provider}>
          <Button>{provider.connected ? t("Re-connect") : t("Connect")}</Button>
        </ConnectSecretManagerDialog>
        {
          provider.connected &&
          <Button variant={"ghost"} >{t("Remove")}</Button>
        }
      </div>
    </Card>
  )
}

export default SecretManagerProviderCard