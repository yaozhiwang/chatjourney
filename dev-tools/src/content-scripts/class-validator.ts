import { ClassRegistry } from "../types/class-registry"

class ClassValidator {
  private classRegistry: ClassRegistry
  private validClasses: Set<string>
  private invalidClasses: Set<string>
  private isInitialized: boolean
  private isVisible: boolean
  private lastChecked: Date | null
  private checking: boolean
  private statusMessage: string
  private classPrefix: string
  private ui: {
    container: HTMLElement | null
    toggle: HTMLElement | null
    panel: HTMLElement | null
    status: HTMLElement | null
    summary: HTMLElement | null
    counts: HTMLElement | null
    invalidList: HTMLElement | null
    timestamp: HTMLElement | null
    message: HTMLElement | null
  }

  constructor() {
    this.classRegistry = { lastUpdated: "", classes: [], files: [] }
    this.validClasses = new Set()
    this.invalidClasses = new Set()
    this.isInitialized = false
    this.isVisible = true
    this.lastChecked = null
    this.checking = false
    this.statusMessage = "Initializing..."
    this.classPrefix = "cj"

    this.ui = {
      container: null,
      toggle: null,
      panel: null,
      status: null,
      summary: null,
      counts: null,
      invalidList: null,
      timestamp: null,
      message: null
    }

    this.toggleVisibility = this.toggleVisibility.bind(this)
    this.refresh = this.refresh.bind(this)
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return

    this.injectStyles()

    this.createUI()

    this.setupHotReload()

    this.refresh()

    this.isInitialized = true
    console.log("[ClassValidator] Initialized")
  }

  private createUI(): void {
    // Main container
    this.ui.container = document.createElement("div")
    this.ui.container.className = `${this.classPrefix}-class-validator`

    // Toggle button
    this.ui.toggle = document.createElement("div")
    this.ui.toggle.className = `${this.classPrefix}-class-validator-toggle`
    this.ui.toggle.addEventListener("click", this.toggleVisibility)

    // Panel container
    this.ui.panel = document.createElement("div")
    this.ui.panel.className = `${this.classPrefix}-class-validator-panel`

    // Create header
    const header = document.createElement("div")
    header.className = `${this.classPrefix}-class-validator-header`

    const title = document.createElement("span")
    title.textContent = "Class Validator"

    const actions = document.createElement("div")
    actions.className = `${this.classPrefix}-class-validator-actions`

    const refreshBtn = document.createElement("button")
    refreshBtn.textContent = "↻"
    refreshBtn.addEventListener("click", this.refresh)

    const closeBtn = document.createElement("button")
    closeBtn.textContent = "×"
    closeBtn.addEventListener("click", this.toggleVisibility)

    actions.appendChild(refreshBtn)
    actions.appendChild(closeBtn)
    header.appendChild(title)
    header.appendChild(actions)

    // Status container
    this.ui.status = document.createElement("div")
    this.ui.status.className = `${this.classPrefix}-class-validator-status`

    // Summary
    this.ui.summary = document.createElement("div")
    this.ui.summary.className = `${this.classPrefix}-class-validator-summary`

    // Counts
    this.ui.counts = document.createElement("div")
    this.ui.counts.className = `${this.classPrefix}-class-validator-counts`

    // Invalid list (created when needed)
    this.ui.invalidList = null

    // Timestamp
    this.ui.timestamp = document.createElement("div")
    this.ui.timestamp.className = `${this.classPrefix}-class-validator-timestamp`

    // Status message
    this.ui.message = document.createElement("div")
    this.ui.message.className = `${this.classPrefix}-class-validator-message`

    // Assemble the UI
    this.ui.status.appendChild(this.ui.summary)
    this.ui.status.appendChild(this.ui.counts)
    this.ui.status.appendChild(this.ui.timestamp)
    this.ui.status.appendChild(this.ui.message)

    this.ui.panel.appendChild(header)
    this.ui.panel.appendChild(this.ui.status)

    this.ui.container.appendChild(this.ui.panel)
    this.ui.container.appendChild(this.ui.toggle)

    // Add to document
    document.body.appendChild(this.ui.container)

    // Update UI
    this.updateUI()
  }

  private injectStyles(): void {
    const style = document.createElement("style")
    style.textContent = `
      .${this.classPrefix}-class-validator {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        position: fixed;
        z-index: 999999;
        bottom: 20px;
        right: 20px;
        font-size: 12px;
      }

      .${this.classPrefix}-class-validator-toggle {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #d1d5db;
        cursor: pointer;
        position: absolute;
        bottom: 0;
        right: 0;
        border: 2px solid #fff;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
        transition: all 0.2s;
      }

      .${this.classPrefix}-class-validator-panel {
        background-color: rgba(0,0,0,0.8);
        color: #fff;
        width: 300px;
        max-height: 400px;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        margin-bottom: 15px;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        backdrop-filter: blur(4px);
        transition: opacity 0.2s, transform 0.2s;
      }

      .${this.classPrefix}-class-validator-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: rgba(255,255,255,0.1);
        font-weight: 600;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .${this.classPrefix}-class-validator-actions {
        display: flex;
        gap: 8px;
      }

      .${this.classPrefix}-class-validator-actions button {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 3px;
      }

      .${this.classPrefix}-class-validator-actions button:hover {
        background-color: rgba(255,255,255,0.1);
      }

      .${this.classPrefix}-class-validator-status {
        padding: 12px;
        font-size: 12px;
        overflow: auto;
        flex: 1;
      }

      .${this.classPrefix}-class-validator-summary {
        margin-bottom: 8px;
        font-weight: 500;
      }

      .${this.classPrefix}-class-validator-success {
        color: #4ade80;
      }

      .${this.classPrefix}-class-validator-error {
        color: #f87171;
      }

      .${this.classPrefix}-class-validator-counts {
        margin-bottom: 12px;
        color: #d1d5db;
      }

      .${this.classPrefix}-class-validator-invalid-list {
        margin-top: 8px;
        margin-bottom: 12px;
      }

      .${this.classPrefix}-class-validator-list-title {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .${this.classPrefix}-class-validator-list {
        max-height: 150px;
        overflow-y: auto;
        padding-left: 8px;
        border-left: 2px solid rgba(255,255,255,0.1);
      }

      .${this.classPrefix}-class-validator-item {
        color: #f87171;
        padding: 2px 0;
        font-family: monospace;
      }

      .${this.classPrefix}-class-validator-timestamp {
        color: #9ca3af;
        font-size: 10px;
        margin-top: 12px;
      }

      .${this.classPrefix}-class-validator-message {
        margin-top: 4px;
        color: #9ca3af;
        font-size: 10px;
      }

      .${this.classPrefix}-class-validator-hidden {
        display: none;
      }
    `
    document.head.appendChild(style)
  }

  private toggleVisibility(): void {
    this.isVisible = !this.isVisible
    this.updateVisibility()
  }

  private updateVisibility(): void {
    if (!this.ui.panel) return

    if (this.isVisible) {
      this.ui.panel.classList.remove(
        `${this.classPrefix}-class-validator-hidden`
      )
    } else {
      this.ui.panel.classList.add(`${this.classPrefix}-class-validator-hidden`)
    }
  }

  private updateUI(): void {
    if (!this.ui.container) return

    // Update visibility
    this.updateVisibility()

    // Update toggle color
    if (this.ui.toggle) {
      this.ui.toggle.style.backgroundColor = this.getStatusColor()
    }

    const validCount = this.validClasses.size
    const invalidCount = this.invalidClasses.size
    const totalCount = this.classRegistry.classes.length

    // Update summary
    if (this.ui.summary) {
      this.ui.summary.innerHTML = ""

      const statusEl = document.createElement("div")
      if (invalidCount === 0) {
        statusEl.className = `${this.classPrefix}-class-validator-success`
        statusEl.textContent = "✓ All classes are valid"
      } else {
        statusEl.className = `${this.classPrefix}-class-validator-error`
        statusEl.textContent = `✗ ${invalidCount} invalid ${
          invalidCount === 1 ? "class" : "classes"
        }`
      }

      this.ui.summary.appendChild(statusEl)
    }

    // Update counts
    if (this.ui.counts) {
      this.ui.counts.textContent = `${validCount}/${totalCount} valid`
    }

    // Update invalid list
    if (invalidCount > 0) {
      // Create the invalid list if it doesn't exist
      if (!this.ui.invalidList) {
        this.ui.invalidList = document.createElement("div")
        this.ui.invalidList.className = `${this.classPrefix}-class-validator-invalid-list`

        const title = document.createElement("div")
        title.className = `${this.classPrefix}-class-validator-list-title`
        title.textContent = "Missing classes:"

        const list = document.createElement("div")
        list.className = `${this.classPrefix}-class-validator-list`

        this.ui.invalidList.appendChild(title)
        this.ui.invalidList.appendChild(list)

        // Insert before timestamp
        if (this.ui.status && this.ui.timestamp) {
          this.ui.status.insertBefore(this.ui.invalidList, this.ui.timestamp)
        }
      }

      // Update list items
      const listContainer = this.ui.invalidList.querySelector(
        `.${this.classPrefix}-class-validator-list`
      )
      if (listContainer) {
        listContainer.innerHTML = ""

        Array.from(this.invalidClasses).forEach((className) => {
          const item = document.createElement("div")
          item.className = `${this.classPrefix}-class-validator-item`
          item.textContent = className
          listContainer.appendChild(item)
        })
      }
    } else if (this.ui.invalidList) {
      // Remove invalid list if there are no invalid classes
      this.ui.invalidList.remove()
      this.ui.invalidList = null
    }

    // Update timestamp
    if (this.ui.timestamp) {
      if (this.lastChecked) {
        this.ui.timestamp.textContent = `Last checked: ${this.lastChecked.toLocaleTimeString()}`
        this.ui.timestamp.classList.remove(
          `${this.classPrefix}-class-validator-hidden`
        )
      } else {
        this.ui.timestamp.classList.add(
          `${this.classPrefix}-class-validator-hidden`
        )
      }
    }

    // Update status message
    if (this.ui.message) {
      this.ui.message.textContent = this.statusMessage
    }
  }

  private getStatusColor(): string {
    if (this.checking) return "#d1d5db" // gray
    if (this.invalidClasses.size === 0) return "#4ade80" // green
    return "#f87171" // red
  }

  /**
   * Get classes from the host page (DOM and stylesheets)
   */
  private async getHostPageClasses(): Promise<Set<string>> {
    const hostClasses = new Set<string>()

    // Extract from DOM
    document.querySelectorAll("*").forEach((el) => {
      if (el.classList && el.classList.length > 0) {
        el.classList.forEach((cls) => hostClasses.add(cls))
      }
    })

    // Extract from stylesheets
    try {
      await Promise.all(
        Array.from(document.styleSheets).map(async (sheet) => {
          try {
            const rules = Array.from(sheet.cssRules).flat()
            rules.forEach((rule) => {
              if (rule.constructor.name === "CSSStyleRule") {
                const styleRule = rule as CSSStyleRule
                const classMatches =
                  styleRule.selectorText.match(/\.[a-zA-Z0-9_-]+/g)
                if (classMatches) {
                  classMatches.forEach((match) =>
                    hostClasses.add(match.substring(1))
                  )
                }
              }
            })
          } catch (e) {
            // Skip CORS-restricted stylesheets
          }
        })
      )
    } catch (e) {
      console.error("[ClassValidator] Error accessing stylesheets:", e)
    }

    return hostClasses
  }

  public async validate(): Promise<void> {
    this.checking = true
    this.statusMessage = "Checking classes..."
    this.updateUI()

    try {
      const hostClasses = await this.getHostPageClasses()

      this.validClasses.clear()
      this.invalidClasses.clear()

      // Check each class from registry
      this.classRegistry.classes.forEach((cls) => {
        if (hostClasses.has(cls)) {
          this.validClasses.add(cls)
        } else {
          this.invalidClasses.add(cls)
        }
      })

      this.lastChecked = new Date()
      this.statusMessage = "Validation complete"
    } catch (error) {
      console.error("[ClassValidator] Validation error:", error)
      this.statusMessage = "Validation failed"
    } finally {
      this.checking = false
      this.updateUI()
    }
  }

  private async refresh(): Promise<void> {
    this.queryClasses()
  }

  private setupHotReload(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "CLASS_REGISTRY_UPDATED") {
        console.log("[ClassValidator] Received updated class registry")
        this.classRegistry = message.data
        this.validate()
        sendResponse({ status: "updated" })
      }
      return true
    })
  }

  private queryClasses(): void {
    chrome.runtime.sendMessage(
      { action: "query-class-validator" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error sending query message:",
            chrome.runtime.lastError
          )
          return
        }
        console.log("[ClassValidator] Received resp class registry")
        this.classRegistry = response.data
        this.validate()
      }
    )
  }
}

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  new ClassValidator().init()
} else {
  document.addEventListener("DOMContentLoaded", () => {
    new ClassValidator().init()
  })
}
