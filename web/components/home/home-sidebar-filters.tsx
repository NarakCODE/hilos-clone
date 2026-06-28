"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  IconActivity,
  IconAlertCircle,
  IconBook,
  IconChartBar,
  IconCircleDot,
  IconExclamationCircle,
  IconHome,
  IconTicket,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { WorkspaceSettingsDropdown } from "@/components/workspace-settings-dropdown"
import { homeSidebarGroups } from "@/lib/home/mock-data"
import type { HomeSidebarGroup } from "@/lib/home/types"
import { cn } from "@/lib/utils"

const BADGED_VIEW_KEYS = new Set(["at-risk", "needs-attention", "sla-breaching"])

function HomeFilterIcon({
  groupKey,
  itemKey,
}: {
  groupKey: HomeSidebarGroup["key"]
  itemKey: string
}) {
  if (groupKey === "views") {
    if (itemKey === "overview") return <IconHome className="size-4" />
    if (itemKey === "activity") return <IconActivity className="size-4" />
    if (itemKey === "analytics") return <IconChartBar className="size-4" />
  }

  if (groupKey === "sections") {
    if (itemKey === "tickets") return <IconTicket className="size-4" />
    if (itemKey === "customers") return <IconUser className="size-4" />
    if (itemKey === "knowledge-base") return <IconBook className="size-4" />
  }

  if (groupKey === "alerts") {
    if (itemKey === "at-risk") return <IconUsers className="size-4" />
    if (itemKey === "needs-attention")
      return <IconExclamationCircle className="size-4" />
    if (itemKey === "sla-breaching")
      return <IconAlertCircle className="size-4" />
  }

  return <IconCircleDot className="size-4" />
}

export function HomeSidebarFilters() {
  const searchParams = useSearchParams()
  const activeView = searchParams.get("view") ?? "overview"

  return (
    <div className="flex flex-col gap-5 px-3 py-3">
      <SidebarGroup>
        <WorkspaceSettingsDropdown />
      </SidebarGroup>

      {homeSidebarGroups.map((group) => (
        <SidebarGroup key={group.key} className="gap-2 p-2 pb-3">
          <SidebarGroupLabel className="px-2 py-2 font-mono text-xs uppercase tracking-widest text-sidebar-foreground/65">
            {group.label}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  group.key === "views" && item.key === activeView
                const shouldShowBadge =
                  group.key === "alerts" && BADGED_VIEW_KEYS.has(item.key)

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={group.key === "sections" ? `/${item.key}` : `/?view=${item.key}`}
                        />
                      }
                      isActive={isActive}
                      className="h-8 rounded-lg px-2"
                    >
                      <HomeFilterIcon
                        groupKey={group.key}
                        itemKey={item.key}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {shouldShowBadge ? (
                      <SidebarMenuBadge
                        className={cn(
                          "top-1.5 rounded-full px-1.5 text-xs font-medium",
                          isActive
                            ? "bg-background text-sidebar-accent-foreground"
                            : "bg-muted-foreground/10 text-sidebar-foreground/80"
                        )}
                      >
                        {item.count}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  )
}
