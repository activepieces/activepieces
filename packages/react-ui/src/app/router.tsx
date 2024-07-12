import { Navigate, createBrowserRouter } from "react-router-dom";
import FlowsTable from "../app/routes/flows";
import { SignInForm } from "../app/routes/sign-in";
import { authenticationSession } from "../features/authentication/lib/authentication-session";
import { Sidebar } from "@/components/sidebar";
import FlowRunsTable from "./routes/runs";
import AppConnectionsTable from "./routes/connections";

const AllowOnlyLoggedIn = ({ children }: { children: React.ReactNode }) => {
    if (!authenticationSession.isLoggedIn()) {
        return <Navigate to="/sign-in" replace />;
    }
    return children;
};

export const router = createBrowserRouter([
    {
        path: "/flows",
        element: (
            <AllowOnlyLoggedIn>
                <Sidebar>
                    <FlowsTable />
                </Sidebar>
            </AllowOnlyLoggedIn>
        ),
    },
    {
        path: "/runs",
        element: (
            <AllowOnlyLoggedIn>
                <Sidebar>
                    <FlowRunsTable />
                </Sidebar>
            </AllowOnlyLoggedIn>
        ),
    },
    {
        path: "/connections",
        element: (
            <AllowOnlyLoggedIn>
                <Sidebar>
                    <AppConnectionsTable />
                </Sidebar>
            </AllowOnlyLoggedIn>
        ),
    },
    {
        path: "/sign-in",
        element: (
            <SignInForm />
        ),
    }
]);
