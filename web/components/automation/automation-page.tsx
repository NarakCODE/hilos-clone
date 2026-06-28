"use client"

import * as React from "react"
import {
  IconSettingsAutomation,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { mockAutomationRules } from "@/lib/automation/mock-data"
import type { AutomationRule } from "@/lib/automation/types"

type AutomationPageProps = {
  title: string
  description: string
  metrics?: Array<{ label: string; value: string; tone?: "default" | "positive" | "warning" }>
}

export function AutomationPage({ title, description, metrics }: AutomationPageProps) {
  const [rules, setRules] = React.useState<AutomationRule[]>(() => mockAutomationRules)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredRules = React.useMemo(() => {
    return rules.filter((rule) => {
      const query = searchQuery.toLowerCase()
      return (
        rule.name.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query) ||
        rule.trigger.toLowerCase().includes(query) ||
        rule.action.toLowerCase().includes(query)
      )
    })
  }, [rules, searchQuery])

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    )
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

      {/* Rules List Container */}
      <section className="flex flex-col flex-1 min-h-0 rounded-xl border bg-background overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-6 border-b sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <IconSettingsAutomation className="size-4" />
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full pl-9 text-xs sm:w-60"
              />
            </div>
            <Button size="sm" className="h-9 rounded-lg text-xs">
              <IconPlus className="size-3.5 mr-1" />
              Create Rule
            </Button>
          </div>
        </div>

        {/* Rules Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-zinc-50/50 dark:bg-zinc-950/25">
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rule Details</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Runs Today</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                    No automation rules found matching search.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-4 max-w-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-foreground">{rule.name}</span>
                        <span className="text-[10px] text-muted-foreground leading-normal">{rule.description}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="h-5 text-[9px] px-1.5 font-medium border-blue-200/50 text-blue-700 bg-blue-50/50 dark:text-blue-400 dark:bg-blue-950/20">
                        {rule.trigger}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="h-5 text-[9px] px-1.5 font-medium border-amber-200/50 text-amber-700 bg-amber-50/50 dark:text-amber-400 dark:bg-amber-950/20">
                        {rule.action}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs font-semibold text-foreground">
                      {rule.runsTodayCount}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                          aria-label={`Toggle active state for ${rule.name}`}
                        />
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${rule.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
