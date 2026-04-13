import * as React from "react"

function Button({ 
  className = "", 
  variant = "default", 
  size = "default", 
  children, 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    default: "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white hover:brightness-105 shadow-[0_10px_24px_rgba(139,92,246,0.26)]",
    outline: "border border-fuchsia-100 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-fuchsia-50 dark:hover:bg-white/10 text-neutral-900 dark:text-neutral-100",
    destructive: "bg-gradient-to-r from-rose-500 to-red-500 text-white hover:brightness-105",
    warning: "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-105",
    ghost: "hover:bg-fuchsia-50 dark:hover:bg-white/8 text-neutral-900 dark:text-neutral-100",
  }
  
  const sizes = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-6 text-base",
    icon: "h-9 w-9",
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export { Button }
