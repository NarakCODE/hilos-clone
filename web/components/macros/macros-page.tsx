"use client"

import * as React from "react"
import {
  IconCopy,
  IconCheck,
  IconMessage2,
  IconSearch,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockMacros } from "@/lib/macros/mock-data"
import type { Macro } from "@/lib/macros/types"

type MacrosPageProps = {
  title: string
  description: string
  metrics?: Array<{ label: string; value: string; tone?: "default" | "positive" | "warning" }>
}

export function MacrosPage({ title, description, metrics }: MacrosPageProps) {
  const [macros] = React.useState<Macro[]>(() => mockMacros)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<Macro["category"] | "all">("all")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const filteredMacros = React.useMemo(() => {
    return macros.filter((macro) => {
      const matchesCategory = activeCategory === "all" || macro.category === activeCategory
      const matchesSearch =
        macro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        macro.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        macro.content.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [macros, activeCategory, searchQuery])

  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore
    }
  }

  const getCategoryBadgeColor = (category: Macro["category"]) => {
    if (category === "billing") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50"
    if (category === "technical") return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50"
    return "bg-zinc-50 text-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 border-zinc-200/50"
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

      {/* Macros List Container */}
      <section className="flex flex-col flex-1 min-h-0 rounded-xl border bg-background overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-6 border-b sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <IconMessage2 className="size-4" />
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search macros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full pl-9 text-xs sm:w-60"
              />
            </div>
            {/* Category Filters */}
            <div className="flex gap-1">
              {(["all", "billing", "technical", "general"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg capitalize font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                      : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Macros Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/20 dark:bg-zinc-950/5">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMacros.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <IconMessage2 className="size-10 opacity-30 mb-2" />
                <p className="text-xs">No macros found matching search criteria.</p>
              </div>
            ) : (
              filteredMacros.map((macro) => (
                <div key={macro.id} className="flex flex-col rounded-xl border bg-card text-card-foreground p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-foreground leading-none">{macro.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{macro.description}</p>
                    </div>
                    <Badge variant="outline" className={`h-5 text-[9px] px-1.5 capitalize ${getCategoryBadgeColor(macro.category)}`}>
                      {macro.category}
                    </Badge>
                  </div>

                  <div className="flex-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground border">
                    {macro.content}
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-[10px] text-muted-foreground">
                      Used {macro.usageCount} times
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg px-2.5 text-[11px] flex items-center gap-1"
                      onClick={() => handleCopy(macro.id, macro.content)}
                    >
                      {copiedId === macro.id ? (
                        <>
                          <IconCheck className="size-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <IconCopy className="size-3.5" />
                          Copy Template
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
