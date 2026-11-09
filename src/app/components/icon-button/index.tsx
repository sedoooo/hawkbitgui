import { MouseEventHandler, ReactNode } from 'react';
import styles from './styles.module.scss';

export interface IconButtonProps {
  children?: ReactNode;
  className?: string;
  width?: string;
  height?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
  'data-testid'?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export default function IconButton({
  children,
  className,
  width,
  height,
  disabled = false,
  style,
  title,
  'data-testid': dataTestId,
  onClick,
}: IconButtonProps) {
  return (
    <button
      type='button'
      title={title}
      data-testid={dataTestId}
      onClick={onClick}
      className={`${styles.iconButton} ${className} ${disabled ? styles.disabled : ''}`}
      disabled={disabled}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
