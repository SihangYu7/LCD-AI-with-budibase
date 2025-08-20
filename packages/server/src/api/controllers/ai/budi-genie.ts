import { ai } from "@budibase/pro"
import { context, docIds, HTTPError } from "@budibase/backend-core"
import {
  UserCtx,
  AgentChat,
  Message,
  DocumentType,
  Table,
  Screen,
  Application,
} from "@budibase/types"
import sdk from "../../../sdk"

// Enhanced AI interface types for budi-genie
interface AIRecommendation {
  id: string
  type: "component" | "automation" | "data_source" | "workflow"
  title: string
  description: string
  confidence: number
  context: Record<string, any>
  implementation?: string
}

interface SemiStructuredInteraction {
  id: string
  type: "form_builder" | "table_designer" | "automation_wizard" | "ui_builder"
  currentStep: number
  totalSteps: number
  data: Record<string, any>
  suggestions: AIRecommendation[]
}

interface BudiGenieRequest {
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

interface BudiGenieResponse {
  message: string
  recommendations: AIRecommendation[]
  semiStructured?: SemiStructuredInteraction
  nextActions: string[]
  contextUpdates?: Record<string, any>
}

/**
 * Enhanced AI service that provides context-aware assistance
 * Follows Linus principle: "Good code has no special cases"
 */
class BudiGenieService {
  private llm: any
  private db: any

  constructor(llm: any, db: any) {
    this.llm = llm
    this.db = db
  }

  /**
   * Generate recommendations based on current context
   * Simple data structure, no special cases
   */
  async generateRecommendations(
    context: Record<string, any>
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []

    // Analyze current app structure for recommendations
    if (context.currentApp) {
      const app = await this.db.get<Application>(context.currentApp)
      const tables = await sdk.tables.getAllTables()
      const screens = await sdk.screens.fetch()

      // Recommend missing CRUD operations
      for (const table of tables) {
        const hasCreateScreen = screens.some(s =>
          s.routing?.route?.includes(`create-${table.name}`)
        )
        if (!hasCreateScreen) {
          recommendations.push({
            id: `create-${table.name}-screen`,
            type: "component",
            title: `Create form for ${table.name}`,
            description: `Generate a create form screen for the ${table.name} table`,
            confidence: 0.9,
            context: { tableId: table._id, tableName: table.name },
            implementation: `
              Screen: Create ${table.name}
              Route: /create-${table.name}
              Components: Form with fields for ${Object.keys(table.schema || {}).join(", ")}
            `,
          })
        }
      }

      // Recommend automations based on table relationships
      const tableRelations = this.analyzeTableRelations(tables)
      for (const relation of tableRelations) {
        recommendations.push({
          id: `sync-${relation.from}-${relation.to}`,
          type: "automation",
          title: `Auto-sync ${relation.from} with ${relation.to}`,
          description: `Create automation to keep related data synchronized`,
          confidence: 0.7,
          context: relation,
        })
      }
    }

    return recommendations
  }

  /**
   * Handle semi-structured interactions
   * Uses simple state machine, no complex branching
   */
  async processSemiStructured(
    interactionType: string,
    currentData: Record<string, any>,
    userInput: string
  ): Promise<SemiStructuredInteraction> {
    const baseInteraction = {
      id: docIds.generateGUID(),
      type: interactionType as any,
      currentStep: currentData.currentStep || 1,
      totalSteps: this.getTotalSteps(interactionType),
      data: currentData,
      suggestions: [],
    }

    switch (interactionType) {
      case "table_designer":
        return this.handleTableDesigner(baseInteraction, userInput)
      case "form_builder":
        return this.handleFormBuilder(baseInteraction, userInput)
      case "automation_wizard":
        return this.handleAutomationWizard(baseInteraction, userInput)
      default:
        return baseInteraction
    }
  }

  private handleTableDesigner(
    interaction: SemiStructuredInteraction,
    userInput: string
  ): SemiStructuredInteraction {
    const steps = [
      { key: "tableName", prompt: "What should we call this table?" },
      { key: "fields", prompt: "What fields do you need?" },
      { key: "relationships", prompt: "Any relationships to other tables?" },
      { key: "validation", prompt: "What validation rules?" },
    ]

    const currentStep = steps[interaction.currentStep - 1]
    if (currentStep) {
      interaction.data[currentStep.key] = userInput

      // Generate AI suggestions for next step
      if (interaction.currentStep < steps.length) {
        interaction.currentStep++
        interaction.suggestions = this.generateFieldSuggestions(
          interaction.data
        )
      }
    }

    return interaction
  }

  private handleFormBuilder(
    interaction: SemiStructuredInteraction,
    userInput: string
  ): SemiStructuredInteraction {
    // Similar pattern - simple state progression
    const steps = ["layout", "fields", "validation", "styling"]

    if (interaction.currentStep <= steps.length) {
      interaction.data[steps[interaction.currentStep - 1]] = userInput
      interaction.currentStep++
    }

    return interaction
  }

  private handleAutomationWizard(
    interaction: SemiStructuredInteraction,
    userInput: string
  ): SemiStructuredInteraction {
    const steps = ["trigger", "conditions", "actions", "testing"]

    if (interaction.currentStep <= steps.length) {
      interaction.data[steps[interaction.currentStep - 1]] = userInput
      interaction.currentStep++
    }

    return interaction
  }

  private getTotalSteps(interactionType: string): number {
    const stepCounts = {
      table_designer: 4,
      form_builder: 4,
      automation_wizard: 4,
      ui_builder: 5,
    }
    return stepCounts[interactionType] || 3
  }

  private generateFieldSuggestions(
    tableData: Record<string, any>
  ): AIRecommendation[] {
    // AI-powered field suggestions based on table name and existing data
    const suggestions: AIRecommendation[] = []

    if (tableData.tableName) {
      const commonFields = this.getCommonFieldsForEntity(tableData.tableName)
      commonFields.forEach((field, index) => {
        suggestions.push({
          id: `field-${index}`,
          type: "component",
          title: `Add ${field.name} field`,
          description: `${field.type} field commonly used for ${tableData.tableName}`,
          confidence: field.confidence,
          context: { fieldType: field.type, fieldName: field.name },
        })
      })
    }

    return suggestions
  }

  private getCommonFieldsForEntity(
    entityName: string
  ): Array<{ name: string; type: string; confidence: number }> {
    // Simple pattern matching - no complex AI needed
    const patterns = {
      user: [
        { name: "email", type: "email", confidence: 0.95 },
        { name: "firstName", type: "text", confidence: 0.9 },
        { name: "lastName", type: "text", confidence: 0.9 },
        { name: "createdAt", type: "datetime", confidence: 0.8 },
      ],
      product: [
        { name: "name", type: "text", confidence: 0.95 },
        { name: "price", type: "number", confidence: 0.9 },
        { name: "description", type: "longform", confidence: 0.8 },
        { name: "category", type: "options", confidence: 0.7 },
      ],
      order: [
        { name: "orderNumber", type: "text", confidence: 0.95 },
        { name: "total", type: "number", confidence: 0.9 },
        { name: "status", type: "options", confidence: 0.9 },
        { name: "orderDate", type: "datetime", confidence: 0.8 },
      ],
    }

    const entityKey = Object.keys(patterns).find(key =>
      entityName.toLowerCase().includes(key)
    )

    return entityKey ? patterns[entityKey] : []
  }

  private analyzeTableRelations(
    tables: Table[]
  ): Array<{ from: string; to: string; type: string }> {
    const relations = []

    for (const table of tables) {
      if (table.schema) {
        for (const [fieldName, field] of Object.entries(table.schema)) {
          if (field.type === "link") {
            relations.push({
              from: table.name || table._id,
              to: field.tableId || "unknown",
              type: field.relationshipType || "one-to-many",
            })
          }
        }
      }
    }

    return relations
  }
}

/**
 * Main endpoint for enhanced AI interactions
 * Simple request/response pattern - no complex state management
 */
export async function budiGenieChat(
  ctx: UserCtx<BudiGenieRequest, BudiGenieResponse>
) {
  const llm = await ai.getLLMOrThrow()
  const db = context.getAppDB()
  const request = ctx.request.body

  const genieService = new BudiGenieService(llm, db)

  // Generate context-aware recommendations
  const recommendations = await genieService.generateRecommendations(
    request.context || {}
  )

  let semiStructured: SemiStructuredInteraction | undefined

  // Handle semi-structured interactions if requested
  if (request.interactionType === "semi_structured" && request.interactionId) {
    const interactionType = request.context?.userAction || "table_designer"
    semiStructured = await genieService.processSemiStructured(
      interactionType,
      { currentStep: 1 },
      request.message
    )
  }

  // Generate AI response with context
  const prompt = new ai.LLMRequest()
    .addSystemMessage(
      `
      You are Budi-Genie, an intelligent assistant for Budibase app development.
      Current context: ${JSON.stringify(request.context, null, 2)}
      Available recommendations: ${recommendations.length}
      
      Provide helpful, actionable advice for building better Budibase applications.
      Be concise and practical.
    `
    )
    .addUserMessage(request.message)

  const { message } = await llm.prompt(prompt)

  // Suggest next actions based on context
  const nextActions = await generateNextActions(
    request.context,
    recommendations
  )

  ctx.body = {
    message,
    recommendations,
    semiStructured,
    nextActions,
    contextUpdates: {
      lastInteraction: new Date().toISOString(),
      interactionType: request.interactionType,
    },
  }
}

/**
 * Generate contextual next actions
 * Simple rule-based system - no overly complex AI
 */
async function generateNextActions(
  context: Record<string, any> = {},
  recommendations: AIRecommendation[]
): Promise<string[]> {
  const actions = []

  if (recommendations.length > 0) {
    actions.push("Review AI recommendations")
    actions.push("Implement suggested improvements")
  }

  if (context.currentTable) {
    actions.push("Add CRUD screens for this table")
    actions.push("Create automations for data validation")
  }

  if (context.currentScreen) {
    actions.push("Optimize screen layout")
    actions.push("Add interactive components")
  }

  // Default helpful actions
  if (actions.length === 0) {
    actions.push("Create a new table")
    actions.push("Design a screen")
    actions.push("Build an automation")
  }

  return actions.slice(0, 3) // Keep it simple - max 3 actions
}

/**
 * Stream endpoint for real-time AI assistance
 */
export async function budiGenieStream(ctx: UserCtx<BudiGenieRequest, void>) {
  const llm = await ai.getLLMOrThrow()
  const db = context.getAppDB()
  const request = ctx.request.body

  // Set up SSE headers
  ctx.status = 200
  ctx.set("Content-Type", "text/event-stream")
  ctx.set("Cache-Control", "no-cache")
  ctx.set("Connection", "keep-alive")

  try {
    const genieService = new BudiGenieService(llm, db)

    // Stream recommendations first
    const recommendations = await genieService.generateRecommendations(
      request.context || {}
    )

    ctx.res.write(
      `data: ${JSON.stringify({
        type: "recommendations",
        content: recommendations,
      })}\n\n`
    )

    // Then stream AI response
    const prompt = new ai.LLMRequest()
      .addSystemMessage(
        `You are Budi-Genie, providing real-time assistance for Budibase development.`
      )
      .addUserMessage(request.message)

    for await (const chunk of llm.chatStream(prompt)) {
      ctx.res.write(`data: ${JSON.stringify(chunk)}\n\n`)

      if (chunk.type === "done") {
        break
      }
    }

    ctx.res.end()
  } catch (error: any) {
    ctx.res.write(
      `data: ${JSON.stringify({
        type: "error",
        content: error.message,
      })}\n\n`
    )
    ctx.res.end()
  }
}
