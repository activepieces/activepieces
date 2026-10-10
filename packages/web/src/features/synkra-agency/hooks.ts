import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Agency, AgencyClient, AgencyPricing, AgencyTier, ClientTier, synkraAgencyApi } from './api';

const agencyKey = ['synkra-agency'];
const clientsKey = ['synkra-agency-clients'];
const pricingKey = ['synkra-agency-pricing'];

export const synkraAgencyHooks = {
  useAgency: () =>
    useQuery<Agency>({
      queryKey: agencyKey,
      queryFn: () => synkraAgencyApi.get(),
      staleTime: 30_000,
    }),

  useClients: () =>
    useQuery<{ clients: AgencyClient[] }>({
      queryKey: clientsKey,
      queryFn: () => synkraAgencyApi.listClients(),
      staleTime: 30_000,
    }),

  usePricing: () =>
    useQuery<AgencyPricing>({
      queryKey: pricingKey,
      queryFn: () => synkraAgencyApi.getPricing(),
      staleTime: 5 * 60_000,
    }),

  useUpdateProfile: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (params: { name: string }) => synkraAgencyApi.updateProfile(params),
      onSuccess: () => qc.invalidateQueries({ queryKey: agencyKey }),
    });
  },

  useActivate: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => synkraAgencyApi.activate(),
      onSuccess: () => qc.invalidateQueries({ queryKey: agencyKey }),
    });
  },

  useSuspend: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => synkraAgencyApi.suspend(),
      onSuccess: () => qc.invalidateQueries({ queryKey: agencyKey }),
    });
  },

  useUpdateTier: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (tier: AgencyTier) => synkraAgencyApi.updateTier(tier),
      onSuccess: () => qc.invalidateQueries({ queryKey: agencyKey }),
    });
  },

  useUpdateBranding: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (branding: Record<string, unknown>) => synkraAgencyApi.updateBranding(branding),
      onSuccess: () => qc.invalidateQueries({ queryKey: agencyKey }),
    });
  },

  useCreateClient: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (params: { name: string; clientTier: ClientTier }) =>
        synkraAgencyApi.createClient(params),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: clientsKey });
        qc.invalidateQueries({ queryKey: agencyKey });
      },
    });
  },

  useActivateClient: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => synkraAgencyApi.activateClient(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: clientsKey });
        qc.invalidateQueries({ queryKey: agencyKey });
      },
    });
  },

  useSuspendClient: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => synkraAgencyApi.suspendClient(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: clientsKey }),
    });
  },

  useTransferClient: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => synkraAgencyApi.transferClient(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: clientsKey });
        qc.invalidateQueries({ queryKey: agencyKey });
      },
    });
  },
};
