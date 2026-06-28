"use client"

import { useEffect, useRef, useState } from "react"

import { statusLabel } from "@/components/tickets/ticket-detail-helpers"
import {
  getKnowledgeArticleCategoryLabel,
  getKnowledgeArticleUrl,
} from "@/components/tickets/ticket-knowledge-helpers"
import type { KnowledgeArticle } from "@/lib/knowledge-base/types"
import type {
  TicketLinkedArticle,
  TicketTimelineItem,
} from "@/lib/tickets/detail-data"
import type { Ticket, TicketPerson, TicketQueueStatus } from "@/lib/tickets/types"

export type PendingReply = {
  id: string
  body: string
  linkedArticle?: TicketLinkedArticle
}

type UseTicketReplyFlowParams = {
  activeTab: string
  agent: TicketPerson
  onAppendTimelineItem: (event: TicketTimelineItem) => void
  onQueueStatusChange: (nextStatus: TicketQueueStatus) => void
  onSwitchToConversationTab: () => void
  ticket: Ticket
}

const SEND_REPLY_DELAY_MS = 320
const SEND_STATUS_DELAY_MS = 180

export function useTicketReplyFlow({
  activeTab,
  agent,
  onAppendTimelineItem,
  onQueueStatusChange,
  onSwitchToConversationTab,
  ticket,
}: UseTicketReplyFlowParams) {
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [draftMessage, setDraftMessage] = useState("")
  const [draftLinkedArticle, setDraftLinkedArticle] =
    useState<KnowledgeArticle | null>(null)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [pendingReply, setPendingReply] = useState<PendingReply | null>(null)

  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current)
      }
    }
  }, [])

  const toLinkedTicketArticle = (article?: KnowledgeArticle | null) => {
    if (!article) return undefined

    return {
      title: article.title,
      url: getKnowledgeArticleUrl(article),
      category: getKnowledgeArticleCategoryLabel(article),
      summary: article.summary,
    }
  }

  const commitReply = ({
    body,
    linkedArticle,
    nextStatus,
  }: {
    body: string
    linkedArticle?: KnowledgeArticle | null
    nextStatus?: TicketQueueStatus
  }) => {
    const trimmedBody = body.trim()

    if (trimmedBody) {
      onAppendTimelineItem({
        id: `${ticket.id}-reply-${Date.now()}`,
        kind: "message",
        timestamp: "Now",
        direction: "outbound",
        author: agent,
        channel: ticket.channel,
        body: trimmedBody,
        linkedArticle: toLinkedTicketArticle(linkedArticle),
      })
    }

    if (nextStatus) {
      onQueueStatusChange(nextStatus)
      onAppendTimelineItem({
        id: `${ticket.id}-status-${Date.now()}`,
        kind: "event",
        timestamp: "Now",
        title: `Ticket status changed to ${statusLabel[nextStatus]}`,
        detail: `The ticket is now marked as ${statusLabel[nextStatus].toLowerCase()}.`,
        tone:
          nextStatus === "closed" || nextStatus === "resolved"
            ? "success"
            : "neutral",
      })
    }
  }

  const queueReplySubmission = ({
    body,
    linkedArticle,
    nextStatus,
  }: {
    body: string
    linkedArticle?: KnowledgeArticle | null
    nextStatus?: TicketQueueStatus
  }) => {
    const trimmedBody = body.trim()
    if (isSendingReply) return
    if (!trimmedBody && !nextStatus) return

    if (activeTab !== "conversation") {
      onSwitchToConversationTab()
    }

    setIsSendingReply(true)

    if (trimmedBody) {
      setPendingReply({
        id: `${ticket.id}-pending-${Date.now()}`,
        body: trimmedBody,
        linkedArticle: toLinkedTicketArticle(linkedArticle),
      })
    }

    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current)
    }

    sendTimeoutRef.current = setTimeout(() => {
      commitReply({
        body: trimmedBody,
        linkedArticle,
        nextStatus,
      })
      setPendingReply(null)
      setIsSendingReply(false)
    }, trimmedBody ? SEND_REPLY_DELAY_MS : SEND_STATUS_DELAY_MS)
  }

  const submitReply = (nextStatus?: TicketQueueStatus) => {
    const body = draftMessage
    const linkedArticle = draftLinkedArticle

    setDraftMessage("")
    setDraftLinkedArticle(null)

    queueReplySubmission({
      body,
      linkedArticle,
      nextStatus,
    })
  }

  const insertKnowledgeArticle = (article: KnowledgeArticle) => {
    queueReplySubmission({
      body: article.customerReply,
      linkedArticle: article,
    })
  }

  const insertMacro = (macro: string) => {
    setDraftMessage((currentDraft) =>
      [currentDraft.trim(), macro].filter(Boolean).join("\n\n")
    )
  }

  return {
    draftLinkedArticle,
    draftMessage,
    insertKnowledgeArticle,
    insertMacro,
    isSendingReply,
    pendingReply,
    setDraftMessage,
    setDraftLinkedArticle,
    submitReply,
  }
}
