"use client"

import * as React from "react"

import { knowledgeArticles } from "@/lib/knowledge-base/mock-data"
import {
  KNOWLEDGE_BASE_STORAGE_UPDATED_EVENT,
  loadKnowledgeArticlesFromStorage,
} from "@/lib/knowledge-base/storage"
import type { KnowledgeArticle } from "@/lib/knowledge-base/types"

export function useKnowledgeArticlesFromStorage(
  fallback: KnowledgeArticle[] = knowledgeArticles
) {
  const [articles, setArticles] = React.useState(fallback)

  React.useEffect(() => {
    const syncArticles = () => {
      setArticles(loadKnowledgeArticlesFromStorage(fallback))
    }

    syncArticles()

    const handleStorageUpdate = () => {
      syncArticles()
    }

    const handleWindowFocus = () => {
      syncArticles()
    }

    window.addEventListener(
      KNOWLEDGE_BASE_STORAGE_UPDATED_EVENT,
      handleStorageUpdate
    )
    window.addEventListener("focus", handleWindowFocus)

    return () => {
      window.removeEventListener(
        KNOWLEDGE_BASE_STORAGE_UPDATED_EVENT,
        handleStorageUpdate
      )
      window.removeEventListener("focus", handleWindowFocus)
    }
  }, [fallback])

  return articles
}
