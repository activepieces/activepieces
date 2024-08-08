import { Navigate, createBrowserRouter } from 'react-router-dom';
import ProjectSettingsLayout from '@/app/project-dashboard/project-settings-layout';
import { FlowsPage } from '../app/routes/flows';
import { authenticationSession } from '../lib/authentication-session';
import { DashboardContainer } from './components/dashboard-container';
import NotFoundPage from './routes/404-page';
import { ChangePasswordPage } from './routes/change-password';
import AppConnectionsPage from './routes/connections';
import { FlowBuilderPage } from './routes/flows/id';
import { ResetPasswordPage } from './routes/forget-password';
import IssuesPage from './routes/issues';
import PlansPage from './routes/plans';
import FlowsRunPage from './routes/runs';
import { FlowRunPage } from './routes/runs/id';
import AlertsPage from './routes/settings/alerts';
import AppearancePage from './routes/settings/appearance';
import PiecesPage from './routes/settings/pieces';
import TeamPage from './routes/settings/team';
import { SignInPage } from './routes/sign-in';
import { SignUpPage } from './routes/sign-up';
import { ShareTemplatePage } from './routes/templates/share-template';
import { jwtDecode } from "jwt-decode";
import dayjs from 'dayjs';


function isJwtExpired(token: string): boolean {
  if (!token) {
    return true;
  }
  try {
    const decoded = jwtDecode(token);
    if (decoded && decoded.exp && dayjs().isAfter(dayjs.unix(decoded.exp))) {
      return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

const AllowOnlyLoggedIn = ({ children }: { children: React.ReactNode }) => {
  const token = authenticationSession.getToken();

  if (!authenticationSession.isLoggedIn()) {
    return <Navigate to="/sign-in" replace />;
  }

  if (token && isJwtExpired(token)) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/flows" />,
  },
  {
    path: '/flows',
    element: (
      <DashboardContainer>
        <FlowsPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/flows/:flowId',
    element: (
      <AllowOnlyLoggedIn>
        <FlowBuilderPage />
      </AllowOnlyLoggedIn>
    ),
  },
  {
    path: '/runs/:runId',
    element: (
      <AllowOnlyLoggedIn>
        <FlowRunPage />
      </AllowOnlyLoggedIn>
    ),
  },
  {
    path: '/templates/:templateId',
    element: (
      <AllowOnlyLoggedIn>
        <ShareTemplatePage />
      </AllowOnlyLoggedIn>
    ),
  },
  {
    path: '/runs',
    element: (
      <DashboardContainer>
        <FlowsRunPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/issues',
    element: (
      <DashboardContainer>
        <IssuesPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/connections',
    element: (
      <DashboardContainer>
        <AppConnectionsPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/plans',
    element: (
      <DashboardContainer>
        <PlansPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/settings',
    element: (
      <DashboardContainer>
        <Navigate to="/settings/alerts" />
      </DashboardContainer>
    ),
  },
  {
    path: '/forget-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/sign-in',
    element: <SignInPage />,
  },
  {
    path: '/sign-up',
    element: <SignUpPage />,
  },
  {
    path: '/settings/alerts',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <AlertsPage></AlertsPage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/settings/appearance',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <AppearancePage></AppearancePage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/settings/pieces',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <PiecesPage></PiecesPage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/settings/team',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <TeamPage></TeamPage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/*',
    element: (
      <DashboardContainer>
        <Navigate to="/flows" replace />
      </DashboardContainer>
    ),
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
]);
