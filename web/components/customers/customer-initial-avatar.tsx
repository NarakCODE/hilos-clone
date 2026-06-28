import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import {
  getCustomerInitialAvatarToneClassName,
  getCustomerInitials,
} from "@/lib/customers/presentation"
import { cn } from "@/lib/utils"

type CustomerInitialAvatarSize = "sm" | "md" | "lg"

type CustomerInitialAvatarProps = {
  name: string
  size?: CustomerInitialAvatarSize
  className?: string
  badgeClassName?: string
}

const avatarSizeClassName: Record<CustomerInitialAvatarSize, string> = {
  sm: "size-6",
  md: "size-10",
  lg: "size-12",
}

const fallbackTextClassName: Record<CustomerInitialAvatarSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
}

export function CustomerInitialAvatar({
  name,
  size = "md",
  className,
  badgeClassName,
}: CustomerInitialAvatarProps) {
  const toneClassName = getCustomerInitialAvatarToneClassName(name)

  return (
    <Avatar
      className={cn(
        "bg-transparent after:hidden",
        avatarSizeClassName[size],
        className
      )}
    >
      <AvatarFallback
        aria-label={name}
        className={cn(
          "font-semibold",
          toneClassName,
          fallbackTextClassName[size],
          "flex items-center justify-center"
        )}
      >
        {getCustomerInitials(name)}
      </AvatarFallback>
      {badgeClassName ? (
        <AvatarBadge className={badgeClassName} aria-hidden="true" />
      ) : null}
    </Avatar>
  )
}
