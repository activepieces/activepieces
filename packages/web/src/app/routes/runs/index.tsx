import { t } from 'i18next';

import { ProjectHeaderMeta } from '@/app/components/project-layout/project-header-slots';
import { Page } from '@/components/custom/page';
import { RunsTable } from '@/features/flow-runs';

const RunsPage = () => {
  return (
    <Page>
      <ProjectHeaderMeta>
        {t('Every run of every flow in this project, newest first.')}
      </ProjectHeaderMeta>
      <RunsTable />
    </Page>
  );
};

export { RunsPage };
