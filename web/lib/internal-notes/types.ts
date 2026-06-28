export type InternalNote = {
  id: string
  ticketId: string
  ticketSubject: string
  customerName: string
  author: {
    name: string
    avatarInitials: string
  }
  content: string
  createdAt: string
  tags: string[]
}
