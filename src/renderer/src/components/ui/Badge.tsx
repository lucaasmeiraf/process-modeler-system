import { HTMLAttributes } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export default function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 text-xs font-medium'

  const variantStyles = {
    default: 'bg-dark-800 text-dark-300',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' // Changed from blue to gray
  }

  return (
    <span className={clsx(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </span>
  )
}
