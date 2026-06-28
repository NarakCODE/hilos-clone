"use client"

import {
  IconCircle,
  IconCommand,
  IconPlus,
  IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"

const workspaces = [
  { name: "Gray CSM", active: true },
  { name: "Design Team", active: false },
  { name: "Engineering", active: false },
]

export function WorkspaceSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="overflow-hidden rounded-none md:h-8 md:p-0"
          >
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
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="start"
        side="right"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          {workspaces.map((ws) => (
            <DropdownMenuItem key={ws.name}>
              {ws.active ? (
                <IconRosetteDiscountCheckFilled className="size-4 text-primary" />
              ) : (
                <IconCircle className="size-4 text-muted-foreground" />
              )}
              <span>{ws.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconPlus className="size-4" />
            Create New
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
