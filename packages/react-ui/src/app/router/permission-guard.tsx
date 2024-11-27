import { ReactNode } from "react";
import { Permission } from "../../../../shared/src";
import { useAuthorization } from "@/hooks/authorization-hooks";
import { Navigate } from "react-router-dom";

export const RoutePermissionGuard = ({permission,children}:{children: ReactNode, permission:Permission}) =>{
    const {useCheckAccess}=useAuthorization();
    if(!useCheckAccess(permission))
    {
        return <Navigate replace={true} to="/404"></Navigate>
    }
    return children;
}