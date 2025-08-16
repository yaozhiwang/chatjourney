import React, { useState } from "react"
import ReactDOM from "react-dom/client"

import "@/index.css"

import Journey from "./journey"

export function renderJourney() {
  const welcome = document.querySelector(
    'main div[role="presentation"] > .basis-auto.shrink'
  )
  if (welcome) {
    render(welcome)
  }
}

function render(parent: Node) {
  const root = document.createElement("div")
  root.id = "chatjourney-welcome-root"
  parent.appendChild(root)

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Welcome />
    </React.StrictMode>
  )
}

function Welcome({}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <button
        className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 md:whitespace-normal dark:text-gray-300"
        onClick={() => {
          setShowModal(true)
        }}>
        🔍 Discover Your Journey with ChatGPT
      </button>
      {showModal && <Journey />}
    </div>
  )
}
