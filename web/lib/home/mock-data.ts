import type { HomeSidebarGroup } from "./types"

export const homeSidebarGroups: HomeSidebarGroup[] = [
  {
    key: "views",
    label: "Views",
    items: [
      { key: "overview", label: "Overview", count: 4 },
      { key: "activity", label: "Activity", count: 28 },
      { key: "analytics", label: "Analytics", count: 6 },
    ],
  },
  {
    key: "sections",
    label: "Sections",
    items: [
      { key: "tickets", label: "Tickets", count: 32 },
      { key: "customers", label: "Customers", count: 286 },
      { key: "knowledge-base", label: "Knowledge Base", count: 148 },
    ],
  },
  {
    key: "alerts",
    label: "Alerts",
    items: [
      { key: "at-risk", label: "At Risk", count: 14 },
      { key: "needs-attention", label: "Needs Attention", count: 8 },
      { key: "sla-breaching", label: "SLA Breaching", count: 3 },
    ],
  },
]
