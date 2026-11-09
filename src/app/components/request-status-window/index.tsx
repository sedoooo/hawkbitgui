'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';
import { useRequestLogStore } from '@/stores/request-log-store';
import { formatUtcDateTime } from '@/utils/table-display';
import { buildRequestCopyText } from '@/utils/request-log-copy';
import {
  DEFAULT_REQUEST_WINDOW_SIZE,
  parseRequestWindowSize,
  REQUEST_WINDOW_SIZE_STORAGE_KEY,
  resizeRequestWindowSize,
  serializeRequestWindowSize,
  type RequestWindowSize,
} from '@/utils/request-window-size';
import WebIcon from '../icons/web-icon';
import IconButton from '../icon-button';
import MinimizeIcon from '../icons/minimize-icon';
import ExpandIcon from '../icons/expand-icon';

const statusClassName = (state: 'pending' | 'success' | 'error') => {
  if (state === 'success') return styles.success;
  if (state === 'error') return styles.error;
  return styles.pending;
};

type ResizeState = {
  startX: number;
  startY: number;
  startSize: RequestWindowSize;
};

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path for insecure (HTTP) contexts.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export default function RequestStatusWindow() {
  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState<RequestWindowSize>(DEFAULT_REQUEST_WINDOW_SIZE);
  const [isResizing, setIsResizing] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const resizeState = useRef<ResizeState | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entries = useRequestLogStore((state) => state.entries);
  const latest = entries[0];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the persisted size after mount
    setSize(parseRequestWindowSize(window.localStorage.getItem(REQUEST_WINDOW_SIZE_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const persistSize = useCallback((nextSize: RequestWindowSize) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REQUEST_WINDOW_SIZE_STORAGE_KEY, serializeRequestWindowSize(nextSize));
    }
  }, []);

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      resizeState.current = { startX: event.clientX, startY: event.clientY, startSize: size };
      setIsResizing(true);
    },
    [size]
  );

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const start = resizeState.current;

      if (!start) {
        return;
      }

      setSize(resizeRequestWindowSize(start.startSize, event.clientX - start.startX, event.clientY - start.startY));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      resizeState.current = null;
      setSize((current) => {
        persistSize(current);
        return current;
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, persistSize]);

  const handleCopy = useCallback(async () => {
    const text = buildRequestCopyText(latest);
    const copied = await copyToClipboard(text);

    setCopyState(copied ? 'copied' : 'error');

    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
    }

    copyTimeout.current = setTimeout(() => setCopyState('idle'), 1500);
  }, [latest]);

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
    <div
      className={`${styles.window} ${isResizing ? styles.resizing : ''}`}
      data-testid='request-status-window'
      style={{ width: size.width, height: size.height }}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <WebIcon width={16} height={16} />
          <span className={styles.title}>Last request</span>
        </div>
        <div className={styles.headerActions}>
          <button
            type='button'
            className={`${styles.copyButton} ${copyState === 'copied' ? styles.copied : ''}`}
            onClick={handleCopy}
            disabled={!latest}
            title='Copy current request result'
            data-testid='request-status-copy'
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}
          </button>
          <IconButton width='24px' height='24px' onClick={() => setCollapsed(true)} title='Minimize request log'>
            <MinimizeIcon width={16} height={16} />
          </IconButton>
        </div>
      </div>

      <div className={styles.body} data-testid='request-status-body'>
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

      <div
        className={styles.resizeHandle}
        onPointerDown={handleResizeStart}
        data-testid='request-status-resize-handle'
        title='Resize request log'
        role='separator'
        aria-label='Resize request log'
      />
    </div>
  );
}
