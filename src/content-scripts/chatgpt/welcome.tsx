import React, { useState } from "react"
import ReactDOM from "react-dom/client"

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
    <div className="@lg/thread:items-end mb-7 flex items-center justify-center">
      <button
        className="btn btn-ghost text-token-text-primary relative"
        onClick={() => {
          setShowModal(true)
        }}>
        🔍 Discover Your Journey with ChatGPT
      </button>
      {showModal && <Journey />}
    </div>
  )
}
