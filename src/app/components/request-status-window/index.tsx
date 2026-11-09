'use client';

import { useState } from 'react';
import styles from './styles.module.scss';
import { useRequestLogStore } from '@/stores/request-log-store';
import { formatUtcDateTime } from '@/utils/table-display';
import WebIcon from '../icons/web-icon';
import IconButton from '../icon-button';
import MinimizeIcon from '../icons/minimize-icon';
import ExpandIcon from '../icons/expand-icon';

const statusClassName = (state: 'pending' | 'success' | 'error') => {
  if (state === 'success') return styles.success;
  if (state === 'error') return styles.error;
  return styles.pending;
};

export default function RequestStatusWindow() {
  const [collapsed, setCollapsed] = useState(false);
  const entries = useRequestLogStore((state) => state.entries);
  const latest = entries[0];

  if (collapsed) {
    return (
      <div className={styles.window} data-testid='request-status-window'>
        <div className={styles.compactBar}>
          <WebIcon width={16} height={16} />
          <span className={styles.compactText}>{latest ? `${latest.method} ${latest.status ?? '...'}` : 'No requests yet'}</span>
          <span className={`${styles.statusDot} ${latest ? statusClassName(latest.state) : styles.pending}`} aria-hidden='true' />
          <IconButton width='24px' height='24px' onClick={() => setCollapsed(false)} title='Restore request log'>
            <ExpandIcon width={16} height={16} />
          </IconButton>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.window} data-testid='request-status-window'>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <WebIcon width={16} height={16} />
          <span className={styles.title}>Last request</span>
        </div>
        <IconButton width='24px' height='24px' onClick={() => setCollapsed(true)} title='Minimize request log'>
          <MinimizeIcon width={16} height={16} />
        </IconButton>
      </div>

      {latest ? (
        <div className={styles.latest} data-testid='request-status-latest'>
          <div className={styles.line}>
            <span className={styles.method}>{latest.method}</span>
            <span className={`${styles.status} ${statusClassName(latest.state)}`}>{latest.status ?? 'pending'}</span>
            <span className={styles.duration}>{latest.durationMs ?? '—'} ms</span>
          </div>
          <div className={styles.path} title={latest.url}>
            {latest.url}
          </div>
          <div className={styles.meta}>{formatUtcDateTime(latest.startedAt)}</div>
          <div className={styles.summary} title={latest.errorMessage ?? latest.summary}>
            {latest.errorMessage ?? latest.summary}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>No hawkBit requests yet.</div>
      )}

      {entries.length > 1 && (
        <div className={styles.history} data-testid='request-status-history'>
          {entries.slice(1).map((entry) => (
            <div className={styles.historyRow} key={entry.id}>
              <span className={styles.method}>{entry.method}</span>
              <span className={`${styles.status} ${statusClassName(entry.state)}`}>{entry.status ?? '...'}</span>
              <span className={styles.historyPath} title={entry.url}>
                {entry.url}
              </span>
              <span className={styles.historyDuration}>{entry.durationMs ?? '—'} ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
