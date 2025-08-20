import { BaseAPIClient } from "./types"

// Enhanced AI interface types for budi-genie
export interface AIRecommendation {
  id: string
  type: "component" | "automation" | "data_source" | "workflow"
  title: string
  description: string
  confidence: number
  context: Record<string, any>
  implementation?: string
}

export interface SemiStructuredInteraction {
  id: string
  type: "form_builder" | "table_designer" | "automation_wizard" | "ui_builder"
  currentStep: number
  totalSteps: number
  data: Record<string, any>
  suggestions: AIRecommendation[]
}

export interface BudiGenieRequest {
  message: string
  context?: {
    currentApp?: string
    currentTable?: string
    currentScreen?: string
    userAction?: string
  }
  interactionType?: "chat" | "semi_structured" | "recommendation"
  interactionId?: string
}

export interface BudiGenieResponse {
  message: string
  recommendations: AIRecommendation[]
  semiStructured?: SemiStructuredInteraction
  nextActions: string[]
  contextUpdates?: Record<string, any>
}

export interface BudiGenieStreamChunk {
  type: "content" | "recommendations" | "done" | "error"
  content?: string
  recommendations?: AIRecommendation[]
  error?: string
}

export interface BudiGenieEndpoints {
  budiGenieChat: (request: BudiGenieRequest) => Promise<BudiGenieResponse>
  budiGenieStream: (
    request: BudiGenieRequest,
    onChunk: (chunk: BudiGenieStreamChunk) => void,
    onError?: (error: Error) => void
  ) => Promise<void>
}

export const buildBudiGenieEndpoints = (
  API: BaseAPIClient
): BudiGenieEndpoints => ({
  budiGenieChat: async (request: BudiGenieRequest) => {
    return await API.post({
      url: "/api/budi-genie/chat",
      body: request,
    })
  },

  budiGenieStream: async (request, onChunk, onError) => {
    try {
      const response = await fetch("/api/budi-genie/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
        credentials: "same-origin",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = line.slice(6) // Remove 'data: ' prefix
              if (data.trim()) {
                const chunk: BudiGenieStreamChunk = JSON.parse(data)
                onChunk(chunk)
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError)
            }
          }
        }
      }
    } catch (error: any) {
      if (onError) {
        onError(error)
      } else {
        throw error
      }
    }
  },
})
