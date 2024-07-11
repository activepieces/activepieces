import { createBrowserRouter } from "react-router-dom";
import FlowsTable from "../dashboard/flows/page";
import { SignInForm } from "../authentication/sign-in";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <FlowsTable />
        ),
    },
    {
        path: "/sign-in",
        element: (
            <SignInForm />
        ),
    }
]);