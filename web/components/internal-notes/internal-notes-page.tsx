"use client"

import * as React from "react"
import {
  IconNotebook,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockInternalNotes } from "@/lib/internal-notes/mock-data"
import type { InternalNote } from "@/lib/internal-notes/types"

type InternalNotesPageProps = {
  title: string
  description: string
  metrics?: Array<{ label: string; value: string; tone?: "default" | "positive" | "warning" }>
}

export function InternalNotesPage({ title, description, metrics }: InternalNotesPageProps) {
  const [notes, setNotes] = React.useState<InternalNote[]>(() => mockInternalNotes)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [newNoteContent, setNewNoteContent] = React.useState("")
  const [linkedTicket, setLinkedTicket] = React.useState("")
  const [customerName, setCustomerName] = React.useState("")

  const filteredNotes = React.useMemo(() => {
    return notes.filter((note) => {
      const query = searchQuery.toLowerCase()
      return (
        note.content.toLowerCase().includes(query) ||
        note.ticketSubject.toLowerCase().includes(query) ||
        note.customerName.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      )
    })
  }, [notes, searchQuery])

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim()) return

    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      ticketId: linkedTicket || "TC-GEN",
      ticketSubject: linkedTicket ? `Ticket reference ${linkedTicket}` : "General Note",
      customerName: customerName || "Internal",
      author: {
        name: "Jason UXUI",
        avatarInitials: "JU",
      },
      content: newNoteContent,
      createdAt: "Just now",
      tags: ["user-created"],
    }

    setNotes([newNote, ...notes])
    setNewNoteContent("")
    setLinkedTicket("")
    setCustomerName("")
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

      {/* Main Container Split Layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border bg-background lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Left Side: Notes List & Filter */}
        <div className="flex flex-col h-full min-h-0 border-r lg:border-r">
          <div className="flex flex-col gap-3 p-6 border-b sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <IconNotebook className="size-4" />
                {title}
              </h1>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="relative shrink-0">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full pl-9 text-xs sm:w-60"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/20 dark:bg-zinc-950/5">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <IconNotebook className="size-10 opacity-30 mb-2" />
                <p className="text-xs">No internal notes found matching criteria.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-zinc-100 border flex items-center justify-center text-[10px] font-bold dark:bg-zinc-800">
                        {note.author.avatarInitials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">{note.author.name}</span>
                        <span className="text-[9px] text-muted-foreground">{note.createdAt}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] font-medium text-primary hover:underline cursor-pointer">
                        {note.ticketId}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {note.customerName}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="h-4 text-[9px] px-1.5 text-muted-foreground bg-zinc-50/50 dark:bg-zinc-900/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Create New Note Panel */}
        <div className="flex flex-col h-full bg-zinc-50/50 p-6 space-y-4 border-t lg:border-t-0 dark:bg-zinc-950/20 shrink-0">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Add Internal Note</h2>
            <p className="text-[11px] text-muted-foreground">
              Jot down collaboration details, troubleshooting context, or handoff summaries.
            </p>
          </div>

          <form onSubmit={handleAddNote} className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Note Content</label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter private note details..."
                  className="w-full h-32 p-3 text-xs rounded-xl border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Link Ticket ID (Optional)</label>
                <Input
                  placeholder="e.g. TC-201"
                  value={linkedTicket}
                  onChange={(e) => setLinkedTicket(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Customer Name (Optional)</label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-9 text-xs rounded-xl">
              <IconPlus className="size-3.5 mr-1" />
              Create Note
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
