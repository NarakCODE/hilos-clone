export type AccountTier = "enterprise" | "mid-market" | "smb"
export type AccountHealthStatus = "good" | "fair" | "poor"

export type Account = {
  id: string
  name: string
  domain: string
  mrr: number
  healthScore: number
  healthStatus: AccountHealthStatus
  ownerName: string
  ownerEmail: string
  renewalDate: string
  tier: AccountTier
  expansionOpportunity: boolean
}
