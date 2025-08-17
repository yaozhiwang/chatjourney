import config from "../../class-watcher.config"
import { ClassRegistry } from "../types/class-registry"

let currentRegistry: ClassRegistry = { lastUpdated: "", classes: [], files: [] }

interface WebSocketMessage {
  type: string
  registry?: ClassRegistry
}

if (process.env.NODE_ENV === "development") {
  // Create WebSocket connection for hot reload
  const connectWebSocket = (): void => {
    const socket = new WebSocket(`ws://localhost:${config.wsPort}`)

    socket.addEventListener("open", () => {
      console.log("[ClassValidator] Connected to watcher")
    })

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage

        if (data.type === "CLASS_REGISTRY_UPDATE" && data.registry) {
          currentRegistry = data.registry

          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs
                  .sendMessage(tab.id, {
                    type: "CLASS_REGISTRY_UPDATED",
                    data: currentRegistry
                  })
                  .catch(() => {
                    // Ignore errors for tabs without content scripts
                  })
              }
            })
          })
        }
      } catch (e) {
        console.error("[ClassValidator] Error processing WebSocket message:", e)
      }
    })

    socket.addEventListener("close", () => {
      console.log("[ClassValidator] WebSocket closed, reconnecting in 3s...")
      setTimeout(connectWebSocket, 3000)
    })

    socket.addEventListener("error", (error) => {
      console.error("[ClassValidator] WebSocket error:", error)
    })
  }

  connectWebSocket()

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "query-class-validator") {
      console.log("Received init message from content script:", message)
      sendResponse({ status: "success", data: currentRegistry })
    }
    return true
  })
}
