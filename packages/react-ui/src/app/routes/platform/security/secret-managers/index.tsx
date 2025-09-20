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
  fields: {
    displayName: string
    id: string
    placeholder: string
  }[]
  connected: boolean
}

const managers: SecretManagerMetaData[] = [
  {
    name: "AWS",
    logo: "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/102017/logo_0.png?17TK91b1B6OvV2MFrCLfukw1c8oEaNr6&itok=vsanFiUj",
    fields: [
      {
        displayName: "Access Key",
        id: "accessKey",
        placeholder: "YOUR_ACCESS_KEY"
      },
      {
        displayName: "Secret Key",
        id: "secretKey",
        placeholder: "YOUR_SECRET_KEY"
      }
    ],
    connected: false
  }
]

export default SecretMangersPage