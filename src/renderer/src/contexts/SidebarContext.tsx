import { createContext, useContext, useState, type ReactNode } from 'react'

type SidebarContextProps = {
  hideSidebar: boolean
  setHideSidebar: (hidden: boolean) => void
}

const SidebarContext = createContext<SidebarContextProps>({
  hideSidebar: false,
  setHideSidebar: () => { }
})

type SidebarProviderProps = {
  children: ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps): ReactNode {
  const [hideSidebar, setHideSidebar] = useState(false)

  return (
    <SidebarContext.Provider value={{ hideSidebar, setHideSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextProps {
  return useContext(SidebarContext)
}

