import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0e1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            'bg-amber-500 hover:bg-amber-400 text-gray-900 focus:ring-amber-500 shadow-lg shadow-amber-500/20':
              variant === 'primary',
            'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 focus:ring-gray-500':
              variant === 'secondary',
            'hover:bg-gray-800 text-gray-300 hover:text-white focus:ring-gray-500':
              variant === 'ghost',
            'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500':
              variant === 'danger',
            'border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 focus:ring-amber-500':
              variant === 'outline',
          },
          {
            'text-xs px-3 py-1.5': size === 'sm',
            'text-sm px-4 py-2': size === 'md',
            'text-base px-6 py-3': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button }
