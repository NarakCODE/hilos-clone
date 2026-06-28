import { CsmPageTemplate } from "@/components/csm-page-template"
import { getRouteByPathOrThrow } from "@/lib/csm-routes"

const route = getRouteByPathOrThrow("/docs")

export default function DocsPage() {
  return (
    <CsmPageTemplate
      title={route.title}
      description={route.description}
      metrics={route.templateMetrics}
    />
  )
}
