<script lang="ts">
  import {
    Body,
    Button,
    Heading,
    Icon,
    Input,
    Layout,
    Modal,
    ModalContent,
    notifications,
    TextArea,
    Toggle,
    Card,
    Divider,
    StatusLight,
    ProgressBar,
    Badge,
    ActionButton,
    ButtonGroup,
  } from "@budibase/bbui"
  import { onMount, onDestroy } from "svelte"
  import { API } from "@/api"
  import TopBar from "@/components/common/TopBar.svelte"
  import Panel from "@/components/design/Panel.svelte"
  import NavHeader from "@/components/common/NavHeader.svelte"
  import NavItem from "@/components/common/NavItem.svelte"

  // Enhanced AI interface types
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

  // Component state
  let inputValue = ""
  let loading = false
  let chatMessages: Array<{ role: string; content: string; timestamp: Date }> =
    []
  let recommendations: AIRecommendation[] = []
  let currentInteraction: SemiStructuredInteraction | null = null
  let interactionMode: "chat" | "wizard" | "recommendations" = "chat"
  let selectedRecommendations = new Set<string>()

  // Context tracking
  let appContext = {
    currentApp: "",
    currentTable: "",
    currentScreen: "",
    userAction: "",
  }

  // UI references
  let chatContainer: HTMLDivElement
  let textareaElement: HTMLTextAreaElement

  /**
   * Send message to Budi-Genie
   * Simple function - no complex state management
   */
  async function sendMessage() {
    if (!inputValue.trim() || loading) return

    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    // Add user message immediately for responsive UI
    chatMessages = [...chatMessages, userMessage]
    scrollToBottom()

    const messageContent = inputValue
    inputValue = ""
    loading = true

    try {
      const response = await API.post({
        url: "/api/budi-genie/chat",
        body: {
          message: messageContent,
          context: appContext,
          interactionType:
            interactionMode === "wizard" ? "semi_structured" : "chat",
          interactionId: currentInteraction?.id,
        },
      })

      // Add AI response
      chatMessages = [
        ...chatMessages,
        {
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
        },
      ]

      // Update recommendations
      recommendations = response.recommendations || []

      // Update semi-structured interaction if present
      if (response.semiStructured) {
        currentInteraction = response.semiStructured
        if (interactionMode !== "wizard") {
          interactionMode = "wizard"
        }
      }

      scrollToBottom()
    } catch (error) {
      console.error("Error sending message:", error)
      notifications.error("Failed to send message")
    } finally {
      loading = false
    }
  }

  /**
   * Start a new semi-structured interaction
   */
  function startWizard(wizardType: string) {
    interactionMode = "wizard"
    appContext.userAction = wizardType

    const prompts = {
      table_designer: "I want to design a new table",
      form_builder: "I want to create a form",
      automation_wizard: "I want to build an automation",
      ui_builder: "I want to design a screen",
    }

    inputValue = prompts[wizardType] || "I need help with app development"
    sendMessage()
  }

  /**
   * Apply an AI recommendation
   */
  async function applyRecommendation(recommendation: AIRecommendation) {
    try {
      notifications.info("Applying recommendation...")

      // Here you would integrate with existing Budibase APIs
      // For now, we'll simulate the action
      switch (recommendation.type) {
        case "component":
          await simulateComponentCreation(recommendation)
          break
        case "automation":
          await simulateAutomationCreation(recommendation)
          break
        case "data_source":
          await simulateDataSourceCreation(recommendation)
          break
        default:
          console.log("Applying recommendation:", recommendation)
      }

      notifications.success(`Applied: ${recommendation.title}`)
      selectedRecommendations.add(recommendation.id)
      recommendations = [...recommendations] // Trigger reactivity
    } catch (error) {
      console.error("Error applying recommendation:", error)
      notifications.error("Failed to apply recommendation")
    }
  }

  async function simulateComponentCreation(rec: AIRecommendation) {
    // Simulate API call to create component
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log("Created component:", rec.context)
  }

  async function simulateAutomationCreation(rec: AIRecommendation) {
    // Simulate API call to create automation
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log("Created automation:", rec.context)
  }

  async function simulateDataSourceCreation(rec: AIRecommendation) {
    // Simulate API call to create data source
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log("Created data source:", rec.context)
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  /**
   * Scroll chat to bottom
   */
  function scrollToBottom() {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 100)
  }

  /**
   * Switch interaction modes
   */
  function setMode(mode: "chat" | "wizard" | "recommendations") {
    interactionMode = mode
    if (mode === "chat") {
      currentInteraction = null
    }
  }

  /**
   * Get confidence color for recommendations
   */
  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "positive"
    if (confidence >= 0.6) return "warning"
    return "negative"
  }

  /**
   * Get type icon for recommendations
   */
  function getTypeIcon(type: string): string {
    switch (type) {
      case "component":
        return "Apps"
      case "automation":
        return "Workflow"
      case "data_source":
        return "Data"
      case "workflow":
        return "Branch"
      default:
        return "Info"
    }
  }

  onMount(() => {
    // Focus textarea on mount
    if (textareaElement) {
      textareaElement.focus()
    }

    // Initialize with welcome message
    chatMessages = [
      {
        role: "assistant",
        content:
          "👋 Hi! I'm Budi-Genie, your intelligent assistant for Budibase app development.\n\nI can help you with:\n• **Smart recommendations** based on your app structure\n• **Step-by-step wizards** for tables, forms, and automations\n• **Context-aware assistance** for building better apps\n\nHow can I help you today?",
        timestamp: new Date(),
      },
    ]
  })
</script>

<div class="budi-genie-wrapper">
  <TopBar breadcrumbs={[{ text: "Budi-Genie" }]} icon="MagicWand"></TopBar>

  <div class="main-content">
    <!-- Left Panel - Chat History and Modes -->
    <Panel customWidth={280} borderRight noHeaderBorder>
      <NavHeader
        slot="panel-title-content"
        title="Budi-Genie"
        searchable={false}
      />

      <!-- Mode Selector -->
      <div class="mode-selector">
        <ButtonGroup>
          <Button
            size="S"
            secondary={interactionMode !== "chat"}
            cta={interactionMode === "chat"}
            on:click={() => setMode("chat")}
          >
            Chat
          </Button>
          <Button
            size="S"
            secondary={interactionMode !== "wizard"}
            cta={interactionMode === "wizard"}
            on:click={() => setMode("wizard")}
          >
            Wizard
          </Button>
          <Button
            size="S"
            secondary={interactionMode !== "recommendations"}
            cta={interactionMode === "recommendations"}
            on:click={() => setMode("recommendations")}
          >
            AI Tips
          </Button>
        </ButtonGroup>
      </div>

      <Divider />

      <!-- Quick Actions -->
      <div class="quick-actions">
        <Body size="S" style="margin-bottom: 8px;">Quick Start</Body>
        <div class="action-buttons">
          <ActionButton
            icon="Table"
            size="S"
            on:click={() => startWizard("table_designer")}
          >
            Design Table
          </ActionButton>
          <ActionButton
            icon="Form"
            size="S"
            on:click={() => startWizard("form_builder")}
          >
            Create Form
          </ActionButton>
          <ActionButton
            icon="Workflow"
            size="S"
            on:click={() => startWizard("automation_wizard")}
          >
            Build Automation
          </ActionButton>
          <ActionButton
            icon="Layout"
            size="S"
            on:click={() => startWizard("ui_builder")}
          >
            Design Screen
          </ActionButton>
        </div>
      </div>
    </Panel>

    <!-- Main Chat Area -->
    <div class="chat-section">
      <!-- Wizard Progress (if active) -->
      {#if currentInteraction && interactionMode === "wizard"}
        <div class="wizard-header">
          <Card>
            <div class="wizard-progress">
              <Heading size="S"
                >{currentInteraction.type
                  .replace("_", " ")
                  .toUpperCase()}</Heading
              >
              <ProgressBar
                value={currentInteraction.currentStep}
                max={currentInteraction.totalSteps}
              />
              <Body size="S">
                Step {currentInteraction.currentStep} of {currentInteraction.totalSteps}
              </Body>
            </div>
          </Card>
        </div>
      {/if}

      <!-- Chat Messages -->
      <div class="chat-container" bind:this={chatContainer}>
        {#each chatMessages as message}
          <div class="message {message.role}">
            <div class="message-content">
              {#if message.role === "assistant"}
                <Icon name="MagicWand" size="S" />
              {:else}
                <Icon name="User" size="S" />
              {/if}
              <div class="message-text">
                {@html message.content.replace(/\n/g, "<br/>")}
              </div>
            </div>
            <div class="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        {/each}

        {#if loading}
          <div class="message assistant loading">
            <div class="message-content">
              <Icon name="MagicWand" size="S" />
              <div class="message-text">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Input Area -->
      <div class="input-section">
        <div class="input-wrapper">
          <textarea
            bind:value={inputValue}
            bind:this={textareaElement}
            class="message-input"
            placeholder={currentInteraction
              ? `Step ${currentInteraction.currentStep}: Enter your response...`
              : "Ask Budi-Genie anything about your app..."}
            on:keydown={handleKeyDown}
            disabled={loading}
            rows="3"
          />
          <Button
            cta
            size="S"
            disabled={loading || !inputValue.trim()}
            on:click={sendMessage}
          >
            Send
          </Button>
        </div>
      </div>
    </div>

    <!-- Right Panel - Recommendations and Suggestions -->
    <Panel customWidth={320} borderLeft noHeaderBorder>
      <NavHeader
        slot="panel-title-content"
        title={interactionMode === "recommendations"
          ? "AI Recommendations"
          : "Suggestions"}
        searchable={false}
      />

      <div class="recommendations-panel">
        {#if recommendations.length > 0}
          {#each recommendations as rec}
            <Card>
              <div class="recommendation-item">
                <div class="recommendation-header">
                  <Icon name={getTypeIcon(rec.type)} size="S" />
                  <Body size="S" weight="medium">{rec.title}</Body>
                  <Badge
                    text={`${Math.round(rec.confidence * 100)}%`}
                    color={getConfidenceColor(rec.confidence)}
                  />
                </div>

                <Body
                  size="XS"
                  style="margin: 8px 0; color: var(--spectrum-global-color-gray-600);"
                >
                  {rec.description}
                </Body>

                {#if rec.implementation}
                  <details class="implementation-details">
                    <summary>Implementation</summary>
                    <pre>{rec.implementation}</pre>
                  </details>
                {/if}

                <div class="recommendation-actions">
                  <Button
                    size="S"
                    cta={!selectedRecommendations.has(rec.id)}
                    secondary={selectedRecommendations.has(rec.id)}
                    disabled={selectedRecommendations.has(rec.id)}
                    on:click={() => applyRecommendation(rec)}
                  >
                    {selectedRecommendations.has(rec.id) ? "Applied" : "Apply"}
                  </Button>
                </div>
              </div>
            </Card>
          {/each}
        {:else}
          <div class="empty-state">
            <Icon name="Lightbulb" size="L" />
            <Body size="S">
              {interactionMode === "recommendations"
                ? "AI recommendations will appear here based on your app structure."
                : "Ask questions to get intelligent suggestions for your Budibase app."}
            </Body>
          </div>
        {/if}
      </div>
    </Panel>
  </div>
</div>

<style>
  .budi-genie-wrapper {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--spectrum-global-color-gray-50);
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .mode-selector {
    padding: 12px;
  }

  .quick-actions {
    padding: 12px;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .chat-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
  }

  .wizard-header {
    padding: 16px;
    background: var(--spectrum-global-color-gray-75);
    border-bottom: 1px solid var(--spectrum-global-color-gray-200);
  }

  .wizard-progress {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .chat-container {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .message.user {
    align-items: flex-end;
  }

  .message.assistant {
    align-items: flex-start;
  }

  .message-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--spectrum-global-color-gray-100);
  }

  .message.user .message-content {
    background: var(--spectrum-global-color-blue-400);
    color: white;
    flex-direction: row-reverse;
  }

  .message-text {
    flex: 1;
    line-height: 1.5;
  }

  .message-time {
    font-size: 11px;
    color: var(--spectrum-global-color-gray-500);
    margin: 0 16px;
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .typing-indicator span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--spectrum-global-color-gray-400);
    animation: typing 1.4s infinite ease-in-out;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
  }
  .typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes typing {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  .input-section {
    padding: 16px;
    border-top: 1px solid var(--spectrum-global-color-gray-200);
    background: var(--spectrum-global-color-gray-50);
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .message-input {
    flex: 1;
    border: 1px solid var(--spectrum-global-color-gray-300);
    border-radius: 8px;
    padding: 12px;
    font-family: inherit;
    font-size: 14px;
    resize: none;
    outline: none;
    transition: border-color 0.2s;
  }

  .message-input:focus {
    border-color: var(--spectrum-global-color-blue-400);
  }

  .recommendations-panel {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow-y: auto;
  }

  .recommendation-item {
    padding: 12px;
  }

  .recommendation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .recommendation-actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
  }

  .implementation-details {
    margin: 8px 0;
  }

  .implementation-details summary {
    cursor: pointer;
    font-size: 12px;
    color: var(--spectrum-global-color-blue-600);
  }

  .implementation-details pre {
    margin: 8px 0 0 0;
    padding: 8px;
    background: var(--spectrum-global-color-gray-100);
    border-radius: 4px;
    font-size: 11px;
    white-space: pre-wrap;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 20px;
    text-align: center;
    color: var(--spectrum-global-color-gray-500);
  }
</style>
