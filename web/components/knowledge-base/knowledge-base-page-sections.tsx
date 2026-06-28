import { cn } from "@/lib/utils"

type KnowledgeBaseContentPlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  className?: string
}

export function KnowledgeBaseContentPlaceholder({
  eyebrow,
  title,
  description,
  className,
}: KnowledgeBaseContentPlaceholderProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-dashed bg-card/70 p-6 text-card-foreground sm:p-8",
        className
      )}
    >
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </section>
  )
}
