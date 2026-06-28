"use client"

import * as React from "react"
import {
  IconArrowUpRight,
  IconBuilding,
  IconSearch,
  IconTrendingUp,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockAccounts } from "@/lib/accounts/mock-data"
import type { Account, AccountTier } from "@/lib/accounts/types"

type AccountsPageProps = {
  title: string
  description: string
  metrics?: Array<{ label: string; value: string; tone?: "default" | "positive" | "warning" }>
}

export function AccountsPage({ title, description, metrics }: AccountsPageProps) {
  const [accounts] = React.useState<Account[]>(() => mockAccounts)
  const [activeTier, setActiveTier] = React.useState<AccountTier | "all">("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredAccounts = React.useMemo(() => {
    return accounts.filter((acc) => {
      const matchesTier = activeTier === "all" || acc.tier === activeTier
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTier && matchesSearch
    })
  }, [accounts, activeTier, searchQuery])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val)
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500"
    if (score >= 60) return "bg-amber-500"
    return "bg-rose-500"
  }

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50"
    if (score >= 60) return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50"
    return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50"
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

      {/* Accounts List Container */}
      <section className="flex flex-col flex-1 min-h-0 rounded-xl border bg-background overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-6 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <IconBuilding className="size-4" />
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full pl-9 text-xs sm:w-60"
              />
            </div>
            {/* Tier Filters */}
            <div className="flex gap-1">
              {(["all", "enterprise", "mid-market", "smb"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`px-3 py-1.5 text-xs rounded-lg capitalize font-medium transition-all ${
                    activeTier === tier
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                      : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-zinc-50/50 dark:bg-zinc-950/25">
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tier</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">MRR</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Health</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Renewal Date</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                    No accounts found matching search or filter.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">{account.name}</span>
                        <span className="text-[10px] text-muted-foreground">{account.domain}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="h-5 text-[9px] px-1.5 uppercase font-semibold">
                        {account.tier}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs font-medium text-foreground">
                      {formatCurrency(account.mrr)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${getHealthColor(account.healthScore)}`}
                            style={{ width: `${account.healthScore}%` }}
                          />
                        </div>
                        <Badge
                          variant="outline"
                          className={`h-5 text-[9px] px-1.5 ${getHealthBadgeColor(account.healthScore)}`}
                        >
                          {account.healthScore}%
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="size-5 rounded-full bg-zinc-100 border flex items-center justify-center dark:bg-zinc-800">
                          <span className="text-[8px] font-bold text-foreground">
                            {account.ownerName.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <span className="text-xs text-foreground">{account.ownerName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {account.renewalDate}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {account.expansionOpportunity && (
                          <Badge variant="outline" className="h-5 text-[9px] bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 flex items-center gap-0.5">
                            <IconTrendingUp className="size-3" />
                            Upsell
                          </Badge>
                        )}
                        <Button size="icon-sm" variant="ghost" className="h-8 w-8 rounded-lg">
                          <IconArrowUpRight className="size-3.5" />
                        </Button>
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
