export type InboxChannel = "email" | "chat" | "slack" | "form"
export type InboxThreadStatus = "new" | "open" | "pending" | "resolved" | "closed"

export type InboxMessage = {
  id: string
  senderName: string
  senderEmail?: string
  avatarUrl?: string
  role: "customer" | "agent" | "system"
  content: string
  timestamp: string
}

export type InboxThread = {
  id: string
  customerName: string
  customerEmail: string
  subject: string
  channel: InboxChannel
  status: InboxThreadStatus
  teaser: string
  updatedAt: string
  assignee: {
    name: string
    email: string
  } | null
  messages: InboxMessage[]
}
