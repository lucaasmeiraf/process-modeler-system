import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export type CardVariant = 'default' | 'gradient' | 'glass'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    const baseStyles = 'overflow-hidden transition-all border'

    const variants = {
      default: 'bg-dark-900 border-dark-800 hover:border-dark-600',
      gradient: 'bg-gradient-to-br from-dark-900 to-dark-950 border-dark-800 hover:border-dark-600',
      glass: 'bg-dark-900/80 backdrop-blur-sm border-dark-800 hover:border-dark-600'
    }

    return (
      <div ref={ref} className={clsx(baseStyles, variants[variant], className)} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
