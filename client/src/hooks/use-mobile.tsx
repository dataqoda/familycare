import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const landscapeMql = window.matchMedia("(orientation: landscape)")
    
    const onChange = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT || 
                   (window.innerHeight < 500 && window.innerWidth < 900)
      setIsMobile(mobile)
      setIsLandscape(window.innerHeight < window.innerWidth)
    }
    
    mql.addEventListener("change", onChange)
    landscapeMql.addEventListener("change", onChange)
    onChange()
    
    return () => {
      mql.removeEventListener("change", onChange)
      landscapeMql.removeEventListener("change", onChange)
    }
  }, [])

  return !!isMobile
}

export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false)

  React.useEffect(() => {
    const landscapeMql = window.matchMedia("(orientation: landscape)")
    
    const onChange = () => {
      setIsLandscape(window.innerHeight < window.innerWidth && window.innerHeight < 500)
    }
    
    landscapeMql.addEventListener("change", onChange)
    onChange()
    
    return () => landscapeMql.removeEventListener("change", onChange)
  }, [])

  return isLandscape
}
