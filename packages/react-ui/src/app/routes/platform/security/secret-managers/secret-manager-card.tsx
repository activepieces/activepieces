import { Card } from "@/components/ui/card"
import { t } from "i18next"
import { SecretManagerMetaData } from "."
import ConnectSecretManagerDialog from "./connect-secret-manager-dialog"
import { Button } from "@/components/ui/button"

type SecretManagerCardProps = {
  manager: SecretManagerMetaData
}

const SecretManagerCard = ({
  manager
}: SecretManagerCardProps) => {
  return (
    <Card className="w-full flex justify-between items-center px-4 py-4">
      <div className="flex gap-2 items-center">
        <img className='w-20' src={manager.logo} alt={manager.name} />
        <div>
          <div className='text-lg'>{manager.name}</div>
          <div className='text-sm text-muted-foreground'>
            {t('Configure credentials for {managerName} secret manager.', {
              managerName: manager.name,
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <ConnectSecretManagerDialog manager={manager}>
          <Button>{manager.connected ? t("Re-connect") : t("Connect")}</Button>
        </ConnectSecretManagerDialog>
        {
          manager.connected &&
          <Button variant={"ghost"} >{t("Remove")}</Button>
        }
      </div>
    </Card>
  )
}

export default SecretManagerCard