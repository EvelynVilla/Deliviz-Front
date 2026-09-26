// Hooks de TanStack Query. Las pantallas usan estos, nunca cliente.js directo.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './cliente';

export const usePaquetes = (filtros) => useQuery({ queryKey: ['paquetes', filtros], queryFn: () => api.listarPaquetes(filtros), placeholderData: (prev) => prev });
export const usePaquete = (guia) => useQuery({ queryKey: ['paquete', guia], queryFn: () => api.obtenerPaquete(guia), enabled: !!guia, retry: false });
export const useAlertas = () => useQuery({ queryKey: ['alertas'], queryFn: api.listarAlertas, refetchInterval: 60000 });
export const useRepartidores = () => useQuery({ queryKey: ['repartidores'], queryFn: api.listarRepartidores });
export const useReportes = (rango) => useQuery({ queryKey: ['reportes', rango.desde.toISOString(), rango.hasta.toISOString()], queryFn: () => api.obtenerReportes(rango), placeholderData: (prev) => prev });
export const useAjustes = () => useQuery({ queryKey: ['ajustes'], queryFn: api.obtenerAjustes });
export const useEvidenciaPublica = (token) => useQuery({ queryKey: ['publico', token], queryFn: () => api.obtenerEvidenciaPublica(token), retry: false });

function useMutacion(fn, invalidar) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidar.forEach((k) => qc.invalidateQueries({ queryKey: [k] })) });
}

export const useMarcarAlerta = () => useMutacion(({ id, revisada }) => api.marcarAlertaRevisada(id, revisada), ['alertas', 'paquete']);
export const useGuardarRepartidor = () => useMutacion(api.guardarRepartidor, ['repartidores', 'paquetes']);
export const useGuardarAjustes = () => useMutacion(api.guardarAjustes, ['ajustes', 'alertas', 'paquete']);
export const useGuardarBodega = () => useMutacion(api.guardarBodega, ['ajustes']);
export const useCrearEnlace = () => useMutation({ mutationFn: ({ guia, dias }) => api.crearEnlace(guia, dias) });
