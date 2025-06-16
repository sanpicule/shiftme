import React, { useState, useEffect } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface PageTransitionProps {
  children: React.ReactNode
  isLoading?: boolean
}

export function PageTransition({ children, isLoading = false }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="読み込み中..." />
      </div>
    )
  }

  return (
    <div
      className={`
        transition-all duration-500 ease-out
        ${isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
        }
      `}
    >
      {children}
    </div>
  )
}