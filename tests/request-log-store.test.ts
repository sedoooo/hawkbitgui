import { beforeEach, describe, expect, test } from 'bun:test';
import { MAX_REQUEST_LOG_ENTRIES, useRequestLogStore } from '../src/stores/request-log-store';

describe('request log store', () => {
  beforeEach(() => {
    useRequestLogStore.getState().clearRequests();
  });

  test('records a request and updates it with the result', () => {
    const id = useRequestLogStore.getState().startRequest({ method: 'get', url: '/api/hawkbit/targets' });
    useRequestLogStore.getState().finishRequest(id, {
      state: 'success',
      status: 200,
      statusText: 'OK',
      durationMs: 42,
      summary: '200 OK',
    });

    const [entry] = useRequestLogStore.getState().entries;
    expect(entry.method).toBe('GET');
    expect(entry.url).toBe('/api/hawkbit/targets');
    expect(entry.state).toBe('success');
    expect(entry.status).toBe(200);
    expect(entry.durationMs).toBe(42);
    expect(entry.summary).toBe('200 OK');
  });

  test('keeps the latest entry first and caps the history', () => {
    for (let i = 0; i < MAX_REQUEST_LOG_ENTRIES + 3; i++) {
      useRequestLogStore.getState().startRequest({ method: 'GET', url: `/request/${i}` });
    }

    const entries = useRequestLogStore.getState().entries;
    expect(entries).toHaveLength(MAX_REQUEST_LOG_ENTRIES);
    expect(entries[0].url).toBe(`/request/${MAX_REQUEST_LOG_ENTRIES + 2}`);
  });

  test('clearRequests empties the log', () => {
    useRequestLogStore.getState().startRequest({ method: 'POST', url: '/request' });
    useRequestLogStore.getState().clearRequests();

    expect(useRequestLogStore.getState().entries).toHaveLength(0);
  });
});
