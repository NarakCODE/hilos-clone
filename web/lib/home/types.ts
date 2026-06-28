export interface HomeSidebarItem {
  key: string
  label: string
  count: number
}

export interface HomeSidebarGroup {
  key: string
  label: string
  items: HomeSidebarItem[]
}
