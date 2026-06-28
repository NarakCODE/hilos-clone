import type { InternalNote } from "./types"

export const mockInternalNotes: InternalNote[] = [
  {
    id: "note-1",
    ticketId: "TC-201",
    ticketSubject: "Salesforce account sync fails",
    customerName: "Sarah Jenkins (Acme)",
    author: {
      name: "Jason UXUI",
      avatarInitials: "JU",
    },
    content: "Customer is getting 403 authorization error on integration screen. Confirmed client credentials look correct on Salesforce connected app. Might be a scope missing on their permission set. Needs escalation to infrastructure.",
    createdAt: "2h ago",
    tags: ["salesforce", "integration", "escalated"],
  },
  {
    id: "note-2",
    ticketId: "TC-104",
    ticketSubject: "Billing discrepancy on seat count",
    customerName: "David Miller (Vertex)",
    author: {
      name: "Sarah Connor",
      avatarInitials: "SC",
    },
    content: "Discussed with Finance team. The 13 extra seats were provisioned under sub-account vertex-staging back in May. I need to verify with their admin if those seats are still needed or if they should be deleted/credited.",
    createdAt: "5h ago",
    tags: ["billing", "credits"],
  },
  {
    id: "note-3",
    ticketId: "TC-88",
    ticketSubject: "API rate limit adjustment request",
    customerName: "Elena Rostova (Cyberdyne)",
    author: {
      name: "System Bot",
      avatarInitials: "SB",
    },
    content: "Rate limit lifted automatically for 24 hours to 500 requests/minute. Rule 'Temporary API Boost' triggered. System will revert limit to default on 2026-06-29T14:30:00Z.",
    createdAt: "1d ago",
    tags: ["api", "automation-triggered"],
  },
]
