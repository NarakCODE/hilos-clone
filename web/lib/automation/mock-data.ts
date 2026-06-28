import type { AutomationRule } from "./types"

export const mockAutomationRules: AutomationRule[] = [
  {
    id: "rule-1",
    name: "VIP Routing Rule",
    description: "Assign enterprise accounts with health scores < 60 to Tier 3 agents immediately.",
    trigger: "On Ticket Created",
    action: "Route to Tier-3 Support Queue & Alert Owner",
    isActive: true,
    runsTodayCount: 14,
  },
  {
    id: "rule-2",
    name: "Auto Tag Billing Issues",
    description: "Add tag 'billing' to tickets containing keywords 'invoice', 'charge', or 'pricing'.",
    trigger: "On Message Received",
    action: "Add Tag 'billing'",
    isActive: true,
    runsTodayCount: 42,
  },
  {
    id: "rule-3",
    name: "Stale Ticket Follow-up",
    description: "Send auto-reminder after 48 hours of pending customer status.",
    trigger: "On SLA Threshold Breached",
    action: "Send Email Template 'Stale Follow-up'",
    isActive: false,
    runsTodayCount: 0,
  },
]
