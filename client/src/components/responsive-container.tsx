
import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile, useIsLandscape } from "@/hooks/use-mobile"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  fullHeight?: boolean
}

export function ResponsiveContainer({ 
  children, 
  className, 
  fullHeight = false 
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile()
  const isLandscape = useIsLandscape()

  return (
    <div 
      className={cn(
        "w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8",
        {
          "max-w-7xl": !isMobile,
          "max-w-full": isMobile,
          "px-2": isMobile && isLandscape,
          "min-h-screen": fullHeight && !isLandscape,
          "min-h-[80vh]": fullHeight && isLandscape,
        },
        className
      )}
    >
      {children}
    </div>
  )
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = 1
}: {
  children: React.ReactNode
  className?: string
  cols?: number
}) {
  const isMobile = useIsMobile()
  const isLandscape = useIsLandscape()

  const getGridCols = () => {
    if (isMobile && !isLandscape) return "grid-cols-1"
    if (isMobile && isLandscape) return "grid-cols-2"
    if (cols === 2) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
    if (cols === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    return "grid-cols-1"
  }

  return (
    <div 
      className={cn(
        "grid gap-4 md:gap-6",
        getGridCols(),
        {
          "gap-3": isMobile && isLandscape,
        },
        className
      )}
    >
      {children}
    </div>
  )
}
