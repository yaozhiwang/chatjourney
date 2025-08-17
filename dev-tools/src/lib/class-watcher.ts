import chokidar, { FSWatcher } from "chokidar"
import WebSocket from "ws"

import config from "../../class-watcher.config"
import { ClassRegistry } from "../types/class-registry"
import ClassScanner from "./class-scanner"

export class ClassWatcher {
  private scanner: ClassScanner
  private registry: ClassRegistry | null
  private wss: WebSocket.Server
  private watcher: FSWatcher

  constructor() {
    this.scanner = new ClassScanner()
    this.registry = null
    this.wss = new WebSocket.Server({ port: config.wsPort })
    this.watcher = chokidar.watch(config.scanDirs, {
      ignored: (path, stats) => !!(stats?.isFile() && !path.endsWith(".tsx")),
      persistent: true
    })

    this.initializeWebSocket()
    this.initializeWatcher()
  }

  private initializeWebSocket() {
    console.log(`WebSocket server started on port ${config.wsPort}`)

    this.wss.on("connection", (ws) => {
      console.log("[Watcher] Client connected")

      if (this.registry) {
        ws.send(
          JSON.stringify({
            type: "CLASS_REGISTRY_UPDATE",
            registry: this.registry
          })
        )
      }

      ws.on("close", () => {
        console.log("[Watcher] Client disconnected")
      })
    })
  }

  private initializeWatcher() {
    this.watcher.on("ready", async () => {
      this.getRegistry()
    })

    this.watcher.on("add", async (path: string) => {
      this.scanner.updateFile(path, "add")
      if (!this.registry) return // initial scan
      console.log(`[Watcher] File added: ${path}`)
      this.broadcast()
    })

    this.watcher.on("change", async (path: string) => {
      console.log(`[Watcher] File changed: ${path}`)
      this.scanner.updateFile(path, "change")
      this.broadcast()
    })

    this.watcher.on("unlink", async (path: string) => {
      console.log(`[Watcher] File unlinked: ${path}`)
      this.scanner.updateFile(path, "unlink")
      this.broadcast()
    })

    console.log("[Watcher] Watching for file changes...")
  }

  private getRegistry() {
    this.registry = this.scanner.getClassRegistry()
    console.log(
      `[Watcher] extracted ${this.registry.classes.length} classNames from ${this.registry.files.length} source files`
    )
  }

  private broadcast() {
    try {
      this.getRegistry()

      // Broadcast to all clients
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "CLASS_REGISTRY_UPDATE",
              registry: this.registry
            })
          )
        }
      })
    } catch (error) {
      console.error(`[Watcher] Error updating registry:`, error)
    }
  }
}
