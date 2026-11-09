import { create } from 'zustand';

export const MAX_REQUEST_LOG_ENTRIES = 10;

export type RequestLogState = 'pending' | 'success' | 'error';

export interface RequestLogEntry {
  id: number;
  method: string;
  url: string;
  startedAt: number;
  state: RequestLogState;
  status?: number;
  statusText?: string;
  durationMs?: number;
  summary?: string;
  errorMessage?: string;
}

interface RequestLogStore {
  entries: RequestLogEntry[];
  startRequest: (request: { method?: string; url?: string }) => number;
  finishRequest: (id: number, result: Partial<Omit<RequestLogEntry, 'id' | 'method' | 'url' | 'startedAt'>>) => void;
  clearRequests: () => void;
}

let nextRequestId = 1;

export const useRequestLogStore = create<RequestLogStore>((set) => ({
  entries: [],
  startRequest: ({ method, url }) => {
    const id = nextRequestId++;
    const entry: RequestLogEntry = {
      id,
      method: (method ?? 'GET').toUpperCase(),
      url: url ?? '',
      startedAt: Date.now(),
      state: 'pending',
      summary: 'In flight',
    };
    set((state) => ({ entries: [entry, ...state.entries].slice(0, MAX_REQUEST_LOG_ENTRIES) }));
    return id;
  },
  finishRequest: (id, result) => {
    set((state) => ({
      entries: state.entries.map((entry) => (entry.id === id ? { ...entry, ...result } : entry)),
    }));
  },
  clearRequests: () => set({ entries: [] }),
}));
