import { defineManifest } from "@crxjs/vite-plugin"

import packageJson from "./package.json"

const { version } = packageJson

const name = "ChatJourney: Visualize Your AI Chats"
const description =
  "Transforms your entire AI chat history into a clear and interactive visual timeline."

export default defineManifest(async (env) => {
  return {
    ...{
      manifest_version: 3,
      name: env.mode !== "production" ? `[DEV] ${name}` : name,
      description,
      version,
      icons: {
        "16": "src/assets/logo.png",
        "32": "src/assets/logo.png",
        "48": "src/assets/logo.png",
        "128": "src/assets/logo.png"
      },
      action: {},
      host_permissions: ["https://chatgpt.com/"],
      permissions: [],
      content_scripts: [
        {
          matches: ["https://chatgpt.com/*"],
          js: ["src/content-script/index.tsx"]
        }
      ]
    },
    ...(process.env.BROWSER === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "firefox@getchatjourney.com",
          strict_min_version: "58.0"
        }
      }
    })
  }
})
