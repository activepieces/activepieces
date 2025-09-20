import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { t } from 'i18next';
import SecretManagerCard from './secret-manager-card';

const SecretMangersPage = () => {
  return (
    <div className="flex-col w-full">
        <DashboardPageHeader
          title={t('Secret Managers')}
          description={t('Mange Secret Managers')}
        >
        </DashboardPageHeader>
        {
          managers.map((manager)=> (
            <SecretManagerCard manager={manager} />
          ))
        }
      </div>
  )
}

export type SecretManagerMetaData = {
  name: string
  logo: string
  fields: string[]
  connected: boolean
}

const managers: SecretManagerMetaData[] = [
  {
    name: "AWS",
    logo: "https://icon2.cleanpng.com/20180705/bvy/kisspng-amazon-com-amazon-web-services-cloud-computing-ama-api-gateway-5b3e194ad5c4c6.0629943915307963628756.jpg",
    fields: [
      "accessKey", "secretKey"
    ],
    connected: false
  }
]

export default SecretMangersPage