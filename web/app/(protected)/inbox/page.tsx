import { InboxPage } from "@/components/inbox/inbox-page"
import { getRouteByPathOrThrow } from "@/lib/csm-routes"

const route = getRouteByPathOrThrow("/inbox")

export default function Page() {
  return (
    <InboxPage
      title={route.title}
      description={route.description}
      metrics={route.templateMetrics}
    />
  )
}
