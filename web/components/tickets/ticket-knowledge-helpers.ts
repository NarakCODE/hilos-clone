import type { KnowledgeArticle } from "@/lib/knowledge-base/types"

export function getKnowledgeArticleCategoryLabel(article: KnowledgeArticle) {
  if (article.category === "subscription") return "Tickets & workflows"
  if (article.category === "technical") return "Tickets & workflows"
  if (article.category === "billing") return "Billing"
  if (article.category === "account-login") return "Settings"
  return "Help center"
}

export function getKnowledgeArticleUrl(article: KnowledgeArticle) {
  return `https://help.graycsm.local/articles/${article.id}`
}
