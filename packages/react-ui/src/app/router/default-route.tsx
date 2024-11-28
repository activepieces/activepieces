import { useAuthorization } from "@/hooks/authorization-hooks"
import { authenticationSession } from "@/lib/authentication-session";
import { Navigate } from "react-router-dom";
import { Permission } from "../../../../shared/src";



export const determineDefaultRoute = (useCheckAccess: (permission:Permission)=>boolean)=>{
    if(useCheckAccess(Permission.READ_FLOW))
    {
        return '/flows'
    }
    if(useCheckAccess(Permission.READ_RUN))
    {
        return '/runs';
    }
    if(useCheckAccess(Permission.READ_ISSUES))
      {
        return '/issues';
      }
      return '/settings'
   }

export const DefaultRoute = ()=>{
    const token = authenticationSession.getToken();
    const {useCheckAccess}= useAuthorization();
    if(!token)
    {
        return <Navigate to='/sign-in' replace={true}></Navigate>
    }
   
   return <Navigate to={determineDefaultRoute(useCheckAccess)} replace={true}></Navigate>
}