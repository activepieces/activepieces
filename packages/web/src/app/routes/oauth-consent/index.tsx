import { OAuthScope } from '@activepieces/shared';
import { useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  [OAuthScope.MCP_TOOLS]: 'Access MCP tools across your projects',
  [OAuthScope.MCP_RESOURCES]: 'Access MCP resources across your projects',
};

export const OAuthConsentPage = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const scope = searchParams.get('scope') ?? '';
  const state = searchParams.get('state') ?? '';
  const codeChallenge = searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? '';
  const clientName = searchParams.get('client_name') ?? 'Unknown Application';
  const resource = searchParams.get('resource') ?? '';

  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = authenticationSession.isLoggedIn();

  if (!isLoggedIn) {
    const returnUrl = `/oauth/consent?${searchParams.toString()}`;
    return <Navigate to={`/sign-in?from=${encodeURIComponent(returnUrl)}`} />;
  }

  const scopes = scope.split(' ').filter(Boolean);

  const handleDecision = async (approved: boolean) => {
    setSubmitting(true);
    try {
      const data = await api.post<{ redirectUrl: string }>(
        '/v1/oauth/authorize/decision',
        {
          client_id: clientId,
          redirect_uri: redirectUri,
          scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          resource: resource || undefined,
          approved,
        },
      );
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch {
      // Error handled by global error handler
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <Card className="w-[420px]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Authorize {clientName}</CardTitle>
          <CardDescription>
            <span className="font-semibold">{clientName}</span> wants to access
            your Activepieces account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scopes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Requested Permissions
              </label>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {scopes.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {SCOPE_DESCRIPTIONS[s] ?? s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleDecision(false)}
            disabled={submitting}
          >
            Deny
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleDecision(true)}
            disabled={submitting}
          >
            {submitting ? 'Authorizing...' : 'Approve'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
