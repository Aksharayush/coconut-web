'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')

  useEffect(() => {
    const user = localStorage.getItem('username')

    if (!user) {
      router.push('/') // not logged in
    } else {
      setUsername(user)
    }
  }, [])

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-5">
      
      {/* TOP BAR */}
      <div className="flex justify-between items-center border-b border-zinc-700 pb-3">
        <h1 className="text-xl font-bold">
          Welcome, {username} 👋
        </h1>

        {/* LOGOUT BUTTON */}
        <button
          onClick={() => {
            localStorage.removeItem('username')
            router.push('/')
          }}
          className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="mt-5">
        <p className="text-zinc-400">
          Start chatting...
        </p>
      </div>

    </div>
  )
}
