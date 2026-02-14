import React from 'react';

interface SkeletonCardProps {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonCard({ className = '', children }: SkeletonCardProps) {
  return (
    <div className={`bg-white/60   rounded-2xl border border-white/20 animate-pulse ${className}`}>
      {children || (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24"></div>
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-32"></div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SkeletonText({
  className = '',
  width = 'w-full',
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div
      className={`h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg ${width} ${className} animate-pulse`}
    ></div>
  );
}

export function SkeletonButton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl ${className} animate-pulse`}
    ></div>
  );
}

export function SkeletonAvatar({ size = 'w-12 h-12' }: { size?: string }) {
  return (
    <div
      className={`${size} bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse`}
    ></div>
  );
}
