import { flagsHooks } from "@/hooks/flags-hooks";
import { useEmbedding } from "../embed-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { Button } from "./button";
import { Link } from "react-router-dom";
import { authenticationSession } from "@/lib/authentication-session";
import { t } from "i18next";

const HomeButton = ({route}: {route: string})=> {
    const {embedState} = useEmbedding();
    const branding = flagsHooks.useWebsiteBranding();
    return <>
     {!embedState.hideLogoInBuilder &&
        !embedState.disableNavigationInBuilder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={authenticationSession.appendProjectRoutePrefix(
                route,
              )}>
                <Button variant="ghost" size={'icon'} className="size-10">
                  <img
                    className="h-7 w-7 object-contain"
                    src={branding.logos.logoIconUrl}
                    alt={branding.websiteName}
                  />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Go to Dashboard')}
            </TooltipContent>
          </Tooltip>
        )}
        </>
}

HomeButton.displayName = 'HomeButton';

export {HomeButton};