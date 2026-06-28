export type Macro = {
  id: string
  name: string
  description: string
  content: string
  category: "billing" | "technical" | "general"
  usageCount: number
}
