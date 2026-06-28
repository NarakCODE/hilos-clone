"use client"

import {
  IconBell,
  IconChevronDown,
  IconCommand,
  IconLogout,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function WorkspaceSettingsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" variant="outline" className="w-full justify-start gap-2 px-2">
            <div
              className="flex aspect-square size-6 items-center justify-center rounded-md text-primary-foreground"
              style={{
                background: "var(--primary)",
              }}
            >
              <IconCommand className="size-3.5" />
            </div>
            <span className="truncate font-medium">Gray CSM</span>
            <IconChevronDown className="ml-auto size-3.5 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="start"
        side="right"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <div
                className="flex aspect-square size-8 items-center justify-center text-primary-foreground"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "var(--primary)",
                  boxShadow:
                    "0 0 0 0.667px rgba(0, 0, 0, 0.20) inset, 0 2px 2px 0 rgba(255, 255, 255, 0.10) inset, 0 2px 2.667px -0.667px rgba(42, 42, 42, 0.1), 0 0.667px 0.667px 0 rgba(42, 42, 42, 0.08)",
                }}
              >
                <IconCommand className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Gray CSM</span>
                <span className="truncate text-xs">Workspace</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconSettings />
            Workspace settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconUserPlus />
            Invite people
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconBell />
            Notification settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <IconLogout />
            Leave workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
