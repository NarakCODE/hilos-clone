import { AccountsPage } from "@/components/accounts/accounts-page"
import { getRouteByPathOrThrow } from "@/lib/csm-routes"

const route = getRouteByPathOrThrow("/accounts")

export default function Page() {
  return (
    <AccountsPage
      title={route.title}
      description={route.description}
      metrics={route.templateMetrics}
    />
  )
}
