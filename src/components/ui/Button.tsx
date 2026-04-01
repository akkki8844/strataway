'use client';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconAfter?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'button',
  secondary: 'button secondary',
  ghost: 'button ghost',
  danger: 'button danger',
  success: 'button success',
};

const SIZE_STYLE: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' },
  md: { fontSize: '0.875rem', padding: '0.65rem 1rem' },
  lg: { fontSize: '1rem', padding: '0.8rem 1.4rem', borderRadius: 'var(--radius-lg)' },
};

export default function Button({
  variant = 'primary', size = 'md', loading = false,
  icon, iconAfter, fullWidth = false,
  children, disabled, style, ...rest
}: ButtonProps) {
  return (
    <button
      className={`${VARIANT_CLASS[variant]} btn-press`}
      disabled={disabled || loading}
      style={{
        ...SIZE_STYLE[size],
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
      ) : icon}
      {children}
      {!loading && iconAfter}
    </button>
  );
}
