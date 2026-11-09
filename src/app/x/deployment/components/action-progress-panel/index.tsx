'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import Skeleton from 'react-loading-skeleton';
import styles from './styles.module.scss';
import { Chip } from '@/app/components/chip';
import SpinnerIcon from '@/app/components/icons/spinner-icon';
import { TargetAction } from '@/entities/target-action';
import { useActionStatus } from '@/app/x/deployment/hooks/use-action-status';
import { buildActionTimeline, extractActionProgress, flattenActionMessages, formatActionStatusLabel, getCurrentPhaseIndex } from '@/utils/action-progress';

export interface ActionProgressPanelProps {
  action: TargetAction;
  controllerId: string;
  onStatusUpdate?: (actionId: number | string, status: string) => void;
}

const formatTimestamp = (value?: number): string => (value ? dayjs(value).format('HH:mm:ss') : '—');

export default function ActionProgressPanel({ action, controllerId, onStatusUpdate }: ActionProgressPanelProps) {
  const { logs, isLoading, isRefreshing, error, lastUpdated, isLive, isTerminal, currentStatus, refresh } = useActionStatus({
    controllerId,
    actionId: action.id,
    initialStatus: action.status,
    onStatusUpdate,
  });

  const effectiveStatus = currentStatus ?? action.status;
  const messages = useMemo(() => flattenActionMessages(logs), [logs]);
  const timeline = useMemo(
    () => buildActionTimeline({ status: effectiveStatus, detailStatus: action.detailStatus, logs }),
    [action.detailStatus, effectiveStatus, logs]
  );
  const progress = useMemo(() => extractActionProgress(messages), [messages]);
  const currentPhaseIndex = getCurrentPhaseIndex(timeline);
  const currentPhase = currentPhaseIndex >= 0 ? timeline[currentPhaseIndex] : undefined;
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLive || !messagesContainerRef.current) {
      return;
    }
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [isLive, messages.length]);

  const liveLabel = isTerminal ? `Settled (${formatActionStatusLabel(effectiveStatus)})` : isLive ? 'Live' : 'Paused (tab hidden)';

  return (
    <section className={styles.panel} data-testid={`action-progress-panel-${action.id}`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <div className={styles.statusRow}>
            <span className={styles.eyebrow}>Action #{action.id}</span>
            <Chip value={formatActionStatusLabel(effectiveStatus) || 'unknown'} colorClassName={effectiveStatus} />
            {action.detailStatus && action.detailStatus !== effectiveStatus && <span className={styles.detailStatus}>detail: {action.detailStatus}</span>}
          </div>
          {currentPhase && (
            <span className={styles.phaseSummary} data-testid={`action-progress-phase-${action.id}`}>
              Phase {currentPhaseIndex + 1} of {timeline.length}: {currentPhase.label}
            </span>
          )}
        </div>
        <div className={styles.controls}>
          <span
            className={`${styles.liveIndicator} ${isLive ? styles.live : ''} ${isTerminal ? styles.settled : ''}`}
            data-testid={`action-progress-live-${action.id}`}
            data-live={isLive ? 'true' : 'false'}
          >
            <span className={styles.liveDot} aria-hidden='true' />
            {liveLabel}
          </span>
          <span className={styles.lastUpdated}>{lastUpdated ? `Updated ${dayjs(lastUpdated).format('HH:mm:ss')}` : 'Not loaded'}</span>
          <button type='button' className={styles.refreshButton} onClick={refresh} disabled={isRefreshing} data-testid={`action-progress-refresh-${action.id}`}>
            {isRefreshing && <SpinnerIcon width={14} height={14} />}
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className={styles.progressBlock}>
        <div className={styles.progressLabels}>
          <span>Progress</span>
          <span data-testid={`action-progress-percent-${action.id}`}>
            {progress.percent !== undefined ? `${progress.percent}%` : currentPhase ? currentPhase.label : 'n/a'}
          </span>
        </div>
        <div className={styles.progressTrack} role='progressbar' aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent ?? undefined}>
          <div
            className={`${styles.progressFill} ${isTerminal && effectiveStatus === 'error' ? styles.progressError : ''}`}
            style={{ width: `${progress.percent ?? 0}%` }}
          />
        </div>
        {progress.label && (
          <p className={styles.currentMessage} data-testid={`action-progress-current-${action.id}`}>
            {progress.label}
          </p>
        )}
      </div>

      <ol className={styles.stepper} data-testid={`action-progress-stepper-${action.id}`}>
        {timeline.map((phase, index) => (
          <li key={phase.key} className={`${styles.step} ${styles[phase.state]}`} data-testid={`action-progress-step-${action.id}-${phase.key}`}>
            <span className={styles.marker} aria-hidden='true'>
              {phase.state === 'completed' ? '✓' : index + 1}
            </span>
            <span className={styles.stepBody}>
              <span className={styles.stepLabel}>{phase.label}</span>
              <span className={styles.stepTime}>{formatTimestamp(phase.timestamp)}</span>
            </span>
          </li>
        ))}
      </ol>

      {error && (
        <p className={styles.errorNotice} data-testid={`action-progress-error-${action.id}`}>
          {error}
        </p>
      )}

      <div className={styles.messagesHeader}>
        <span>Status messages</span>
        <span>{messages.length}</span>
      </div>
      <div className={styles.messages} ref={messagesContainerRef} data-testid={`action-progress-messages-${action.id}`}>
        {isLoading && messages.length === 0 ? (
          <Skeleton width={'100%'} height={22} count={4} />
        ) : messages.length === 0 ? (
          <p className={styles.empty}>No status messages yet.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={styles.messageRow} data-testid={`action-progress-message-${action.id}`}>
              <span className={styles.messageTime}>{formatTimestamp(message.reportedAt)}</span>
              <span className={styles.messageType}>{message.type}</span>
              <span className={styles.messageText}>{message.text}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
