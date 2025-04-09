import { ReloadIcon } from '@radix-ui/react-icons'
import { t } from 'i18next'
import { Copy, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../../../components/ui/button'
import { Label } from '../../../../components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip'
import { useToast } from '../../../../components/ui/use-toast'

interface McpUrlProps {
  serverUrl: string
  onRotateToken: () => void
  isRotating: boolean
  hasValidMcp: boolean
}

export const McpUrl = ({ serverUrl, onRotateToken, isRotating, hasValidMcp }: McpUrlProps) => {
  const [showToken, setShowToken] = useState(false)
  const { toast } = useToast()

  const toggleTokenVisibility = () => {
    setShowToken(!showToken)
  }

  const maskedServerUrl = showToken ? serverUrl : serverUrl.replace(/\/([^/]+)\/sse$/, '/••••••••••••••••••••••/sse')

  return (
    <div className="space-y-2 w-full">
      <Label className="mr-2">{t('Server URL')}</Label>

      <div className="flex items-center gap-4">
        <div className="font-mono text-foreground/90 cursor-text w-[600px] border rounded-md px-3 py-2 text-sm">
          {maskedServerUrl}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTokenVisibility}>
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showToken ? t('Hide the token for security') : t('Show the token')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRotateToken}
                  disabled={isRotating || !hasValidMcp}
                >
                  {isRotating ? <ReloadIcon className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Generate a new token for security. This will invalidate the current URL.')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    navigator.clipboard.writeText(serverUrl)
                    toast({
                      description: t('URL copied to clipboard'),
                      duration: 3000,
                    })
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Copy URL to clipboard')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {t(
          'This URL contains a sensitive security token. Only share it with trusted applications and services. Rotate the token if you suspect it has been compromised.',
        )}
      </p>
    </div>
  )
}
