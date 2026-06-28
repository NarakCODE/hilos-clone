"use client"

import * as React from "react"
import {
  IconSettings,
  IconCheck,
  IconClock,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

type SettingsPageProps = {
  title: string
  description: string
  metrics?: Array<{ label: string; value: string; tone?: "default" | "positive" | "warning" }>
}

export function SettingsPage({ title, description, metrics }: SettingsPageProps) {
  const [slaFirstResponse, setSlaFirstResponse] = React.useState("15")
  const [slaResolution, setSlaResolution] = React.useState("4")
  const [emailEnabled, setEmailEnabled] = React.useState(true)
  const [chatEnabled, setChatEnabled] = React.useState(true)
  const [slackEnabled, setSlackEnabled] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 1000)
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

      {/* Main Settings Page Container */}
      <section className="flex flex-col flex-1 min-h-0 rounded-xl border bg-background overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-6 border-b shrink-0">
          <IconSettings className="size-4 text-foreground" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/20 dark:bg-zinc-950/5">
          <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
            {/* SLA Configuration */}
            <div className="space-y-4 rounded-xl border bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <IconClock className="size-4 text-muted-foreground" />
                SLA Targets
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                    First Response SLA (minutes)
                  </label>
                  <Input
                    type="number"
                    value={slaFirstResponse}
                    onChange={(e) => setSlaFirstResponse(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                    Resolution SLA (hours)
                  </label>
                  <Input
                    type="number"
                    value={slaResolution}
                    onChange={(e) => setSlaResolution(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Channels Configuration */}
            <div className="space-y-4 rounded-xl border bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold text-foreground">Active Channels</h2>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">Email Support</span>
                    <p className="text-[10px] text-muted-foreground">Receive inbound emails and reply directly.</p>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} aria-label="Toggle email channel support" />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">In-App Chat</span>
                    <p className="text-[10px] text-muted-foreground">Enable direct real-time chat widgets on consumer app.</p>
                  </div>
                  <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} aria-label="Toggle in-app chat support" />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">Slack Integration</span>
                    <p className="text-[10px] text-muted-foreground">Connect Slack channels to import conversations.</p>
                  </div>
                  <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} aria-label="Toggle slack channel support" />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSaving} className="h-9 text-xs rounded-xl">
                {isSaving ? "Saving Settings..." : "Save Settings"}
              </Button>
              {saveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <IconCheck className="size-4" />
                  Settings saved successfully
                </span>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
