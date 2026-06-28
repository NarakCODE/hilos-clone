import { SettingsPage } from "@/components/settings/settings-page"
import { getRouteByPathOrThrow } from "@/lib/csm-routes"

const route = getRouteByPathOrThrow("/settings")

export default function Page() {
  return (
    <SettingsPage
      title={route.title}
      description={route.description}
      metrics={route.templateMetrics}
    />
  )
}
