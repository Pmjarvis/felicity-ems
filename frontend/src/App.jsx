import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading...')

  // Test backend connection
  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/')
      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      setMessage('❌ Cannot connect to backend. Make sure server is running on port 5000')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
          🎉 Felicity Event Management System
        </h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700 font-semibold">Frontend Status: ✅ Running</p>
          <p className="text-sm text-blue-600 mt-1">React + Vite + Tailwind CSS</p>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">Backend Status:</p>
          <p className="bg-gray-100 p-3 rounded-lg text-sm">{message}</p>
        </div>

        <button
          onClick={testBackend}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
        >
          Test Backend Connection
        </button>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>✨ Phase 1: Project Setup Complete</p>
        </div>
      </div>
    </div>
  )
}

export default App
