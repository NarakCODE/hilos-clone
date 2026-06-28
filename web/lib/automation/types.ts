export type AutomationRule = {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  isActive: boolean
  runsTodayCount: number
}
