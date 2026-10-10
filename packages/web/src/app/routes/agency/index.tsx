import { t } from 'i18next';
import { Building2, Plus, Users, Zap } from 'lucide-react';
import { useState } from 'react';
import { PageTitle } from '@/app/components/page-title';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  AgencyTier,
  ClientTier,
  synkraAgencyHooks,
} from '@/features/synkra-agency';

const TIER_LABELS: Record<AgencyTier, string> = {
  agency_20: 'Agency 20',
  agency_100: 'Agency 100',
  agency_500: 'Agency 500',
};

const STATUS_COLOURS: Record<string, string> = {
  draft: 'bg-gray-3 text-gray-11 border-gray-6',
  active: 'bg-green-2 text-green-11 border-green-6',
  suspended: 'bg-yellow-2 text-yellow-11 border-yellow-6',
  transferred: 'bg-blue-2 text-blue-11 border-blue-6',
};

export function AgencyPage() {
  const { data: agency, isLoading } = synkraAgencyHooks.useAgency();
  const { data: clientsData } = synkraAgencyHooks.useClients();
  const updateProfile = synkraAgencyHooks.useUpdateProfile();
  const activate = synkraAgencyHooks.useActivate();
  const suspend = synkraAgencyHooks.useSuspend();
  const updateTier = synkraAgencyHooks.useUpdateTier();
  const createClient = synkraAgencyHooks.useCreateClient();
  const activateClient = synkraAgencyHooks.useActivateClient();
  const suspendClient = synkraAgencyHooks.useSuspendClient();
  const transferClient = synkraAgencyHooks.useTransferClient();

  const [nameDialog, setNameDialog] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [newClientDialog, setNewClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientTier, setNewClientTier] = useState<ClientTier>('starter');

  if (isLoading || !agency) {
    return (
      <PageTitle title={t('Agency')}>
        <div className="flex h-svh items-center justify-center text-gray-11">
          {t('Loading…')}
        </div>
      </PageTitle>
    );
  }

  const clients = clientsData?.clients ?? [];
  const isDraft = agency.status === 'draft';

  const handleSaveName = () => {
    if (!nameDraft.trim()) return;
    updateProfile.mutate(
      { name: nameDraft.trim() },
      { onSuccess: () => setNameDialog(false) },
    );
  };

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    createClient.mutate(
      { name: newClientName.trim(), clientTier: newClientTier },
      {
        onSuccess: () => {
          setNewClientDialog(false);
          setNewClientName('');
        },
      },
    );
  };

  return (
    <PageTitle title={t('Agency Programme')}>
      <div className="mx-auto w-full max-w-5xl p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t('Agency Programme')}</h1>
            <p className="text-sm text-gray-11 mt-1">
              {agency.name || t('Unnamed agency')} ·{' '}
              {TIER_LABELS[agency.tier]} ·{' '}
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                  STATUS_COLOURS[agency.status] ?? '',
                )}
              >
                {agency.status}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNameDraft(agency.name);
                setNameDialog(true);
              }}
            >
              {t('Rename')}
            </Button>
            {isDraft && (
              <Button
                onClick={() => activate.mutate()}
                disabled={activate.isPending}
              >
                <Zap className="h-4 w-4 mr-1" />
                {t('Activate agency')}
              </Button>
            )}
            {agency.status === 'active' && (
              <Button
                variant="outline"
                onClick={() => suspend.mutate()}
                disabled={suspend.isPending}
              >
                {t('Suspend')}
              </Button>
            )}
          </div>
        </div>

        {/* Draft banner */}
        {isDraft && (
          <div className="rounded-lg border border-yellow-6 bg-yellow-2 p-4 text-sm">
            <div className="font-medium text-yellow-11">
              {t('You are in draft mode')}
            </div>
            <div className="text-yellow-11 mt-1">
              {t(
                'Build client environments and configure branding freely. Nothing is live or billed until you activate.',
              )}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Building2}
            label={t('Client environments')}
            value={`${agency.clientCount} / ${agency.clientEnvironmentsLimit}`}
            sub={`${agency.activeClientCount} ${t('active')}`}
          />
          <StatCard
            icon={Users}
            label={t('Wholesale discount')}
            value={`${Math.round(agency.wholesaleDiscount * 100)}%`}
            sub={t('off public Flow prices')}
          />
          <StatCard
            icon={Zap}
            label={t('Monthly wholesale')}
            value={`R${agency.monthlyWholesaleZar.toLocaleString()}`}
            sub={t('across active clients')}
          />
        </div>

        {/* Tier switcher */}
        <div className="rounded-lg border bg-white p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{t('Agency tier')}</h2>
              <p className="text-sm text-gray-11 mt-0.5">
                {t('Higher tiers unlock more client slots and better wholesale rates.')}
              </p>
            </div>
            <Select
              value={agency.tier}
              onValueChange={(v) => updateTier.mutate(v as AgencyTier)}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agency_20">Agency 20 — R699/mo</SelectItem>
                <SelectItem value="agency_100">Agency 100 — R1,499/mo</SelectItem>
                <SelectItem value="agency_500">Agency 500 — R2,999/mo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clients section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg">
              {t('Client environments')}
            </h2>
            <Button
              onClick={() => setNewClientDialog(true)}
              disabled={agency.clientCount >= agency.clientEnvironmentsLimit}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('New client')}
            </Button>
          </div>

          {clients.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <Building2 className="h-8 w-8 mx-auto text-gray-8 mb-3" />
              <div className="font-medium">
                {t('No client environments yet')}
              </div>
              <p className="text-sm text-gray-11 mt-1">
                {t('Create your first client environment to get started.')}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-white divide-y">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-11 mt-0.5">
                      {c.clientTier} · R{c.wholesaleMonthlyZar}/mo wholesale ·{' '}
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                          STATUS_COLOURS[c.status] ?? '',
                        )}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => activateClient.mutate(c.id)}
                        disabled={activateClient.isPending}
                      >
                        {t('Activate')}
                      </Button>
                    )}
                    {c.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => suspendClient.mutate(c.id)}
                          disabled={suspendClient.isPending}
                        >
                          {t('Suspend')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(t('Transfer this client out of your agency? This cannot be undone without manual re-linking.'))) {
                              transferClient.mutate(c.id);
                            }
                          }}
                          disabled={transferClient.isPending}
                        >
                          {t('Handover')}
                        </Button>
                      </>
                    )}
                    {c.status === 'suspended' && (
                      <Button
                        size="sm"
                        onClick={() => activateClient.mutate(c.id)}
                        disabled={activateClient.isPending}
                      >
                        {t('Reactivate')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={nameDialog} onOpenChange={setNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Rename agency')}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="agency-name">{t('Agency name')}</Label>
            <Input
              id="agency-name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder={t('Acme Automation')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleSaveName} disabled={updateProfile.isPending}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New client dialog */}
      <Dialog open={newClientDialog} onOpenChange={setNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New client environment')}</DialogTitle>
            <DialogDescription>
              {t(
                'A client environment is an isolated Flow workspace. Client data, workflows and connections are never visible to other clients.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div>
              <Label htmlFor="client-name">{t('Client name')}</Label>
              <Input
                id="client-name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder={t('Client business name')}
              />
            </div>
            <div>
              <Label>{t('Client plan')}</Label>
              <Select
                value={newClientTier}
                onValueChange={(v) => setNewClientTier(v as ClientTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClientDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={createClient.isPending || !newClientName.trim()}
            >
              {t('Create client')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTitle>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-gray-11">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      <div className="text-xs text-gray-11 mt-1">{sub}</div>
    </div>
  );
}
