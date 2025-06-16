import React from 'react'
import { PiggyBank, Sparkles } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 animate-spin`}>
          <PiggyBank className={`${iconSizes[size]} text-white`} />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
          <Sparkles className="w-2 h-2 text-white" />
        </div>
      </div>
      
      {text && (
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">{text}</p>
          <div className="flex space-x-1 justify-center mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}