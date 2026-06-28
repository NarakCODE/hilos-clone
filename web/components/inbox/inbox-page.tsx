"use client"

import * as React from "react"
import {
  IconInbox,
  IconMessage2,
  IconSend,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockInboxThreads } from "@/lib/inbox/mock-data"
import type { InboxThread, InboxThreadStatus } from "@/lib/inbox/types"

type InboxPageProps = {
  title: string
  description: string
  metrics?: Array<{ label: string; value: string; tone?: "default" | "positive" | "warning" }>
}

export function InboxPage({ title, description, metrics }: InboxPageProps) {
  const [threads, setThreads] = React.useState<InboxThread[]>(() => mockInboxThreads)
  const [selectedThreadId, setSelectedThreadId] = React.useState<string>(mockInboxThreads[0]?.id || "")
  const [activeFilter, setActiveFilter] = React.useState<InboxThreadStatus | "all">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [replyText, setReplyText] = React.useState("")

  const selectedThread = React.useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || null
  }, [threads, selectedThreadId])

  const filteredThreads = React.useMemo(() => {
    return threads.filter((t) => {
      const matchesFilter = activeFilter === "all" || t.status === activeFilter
      const matchesSearch =
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.teaser.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [threads, activeFilter, searchQuery])

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedThread) return

    const newMessage = {
      id: `msg-new-${Date.now()}`,
      senderName: "Jason UXUI",
      role: "agent" as const,
      content: replyText,
      timestamp: "Just now",
    }

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === selectedThread.id) {
          return {
            ...t,
            teaser: replyText,
            updatedAt: "Just now",
            status: "pending" as const,
            messages: [...t.messages, newMessage],
          }
        }
        return t
      })
    )

    setReplyText("")
  }

  const getChannelIcon = (channel: string) => {
    if (channel === "slack") return <span className="text-pink-600 font-bold text-xs">#</span>
    if (channel === "chat") return <IconMessage2 className="size-3 text-cyan-600" />
    return <span className="text-zinc-600 text-xs">@</span>
  }

  const getStatusColor = (status: InboxThreadStatus) => {
    if (status === "new") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50"
    if (status === "open") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50"
    if (status === "pending") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50"
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50"
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      {/* Metrics Row */}
      {metrics && (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border bg-card p-4 text-card-foreground shadow-xs"
            >
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  metric.tone === "positive"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : metric.tone === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : ""
                }`}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Main Inbox Container */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border bg-background lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Left Side: Threads List */}
        <div className="flex flex-col border-r bg-zinc-50/50 dark:bg-zinc-950/25">
          <div className="p-4 border-b space-y-3">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <IconInbox className="size-4" />
                {title}
              </h1>
              <p className="text-[10px] text-muted-foreground">{description}</p>
            </div>
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
            />
            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hidden">
              {(["all", "new", "open", "pending", "resolved"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 text-xs rounded-md capitalize font-medium transition-all ${
                    activeFilter === filter
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                      : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <IconInbox className="size-8 opacity-30 mb-2" />
                <p className="text-xs">No conversations match the filters.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full flex flex-col gap-1.5 p-4 text-left transition-colors border-l-2 ${
                    selectedThreadId === thread.id
                      ? "bg-zinc-100/60 border-primary dark:bg-zinc-900/60"
                      : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {thread.customerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {thread.updatedAt}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">
                    {thread.subject}
                  </span>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {thread.teaser}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`h-4 text-[9px] px-1.5 ${getStatusColor(thread.status)}`}>
                      {thread.status}
                    </Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {getChannelIcon(thread.channel)}
                      <span className="capitalize">{thread.channel}</span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread Detail */}
        {selectedThread ? (
          <div className="flex flex-col h-full bg-background min-w-0">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground truncate">
                  {selectedThread.subject}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedThread.customerName} &lt;{selectedThread.customerEmail}&gt;
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`h-5 text-[10px] ${getStatusColor(selectedThread.status)}`}>
                  {selectedThread.status}
                </Badge>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/20 dark:bg-zinc-950/5">
              {selectedThread.messages.map((message) => {
                const isAgent = message.role === "agent"
                return (
                  <div
                    key={message.id}
                    className={`flex flex-col max-w-[80%] ${
                      isAgent ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-semibold text-foreground">
                        {message.senderName}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {message.timestamp}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs whitespace-pre-wrap ${
                        isAgent
                          ? "bg-zinc-900 text-zinc-50 rounded-tr-none dark:bg-zinc-100 dark:text-zinc-950"
                          : "bg-zinc-100 text-zinc-900 rounded-tl-none dark:bg-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply Input Area */}
            <form onSubmit={handleSendReply} className="p-4 border-t bg-background shrink-0">
              <div className="flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selectedThread.customerName}...`}
                  className="flex-1 text-xs"
                />
                <Button type="submit" size="icon" className="shrink-0 rounded-lg">
                  <IconSend className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground">
            <IconInbox className="size-12 opacity-20 mb-3" />
            <p className="text-sm">Select a conversation from the left to view detail.</p>
          </div>
        )}
      </div>
    </div>
  )
}
