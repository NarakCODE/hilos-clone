import { InternalNotesPage } from "@/components/internal-notes/internal-notes-page"
import { getRouteByPathOrThrow } from "@/lib/csm-routes"

const route = getRouteByPathOrThrow("/internal-notes")

export default function Page() {
  return (
    <InternalNotesPage
      title={route.title}
      description={route.description}
      metrics={route.templateMetrics}
    />
  )
}
