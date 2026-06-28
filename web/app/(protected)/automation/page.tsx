import { AutomationPage } from "@/components/automation/automation-page"
import { getRouteByPathOrThrow } from "@/lib/csm-routes"

const route = getRouteByPathOrThrow("/automation")

export default function Page() {
  return (
    <AutomationPage
      title={route.title}
      description={route.description}
      metrics={route.templateMetrics}
    />
  )
}
