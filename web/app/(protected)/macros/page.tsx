import { MacrosPage } from "@/components/macros/macros-page"
import { getRouteByPathOrThrow } from "@/lib/csm-routes"

const route = getRouteByPathOrThrow("/macros")

export default function Page() {
  return (
    <MacrosPage
      title={route.title}
      description={route.description}
      metrics={route.templateMetrics}
    />
  )
}
