'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

const page = () => {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [touched, setTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isValid = username.length > 3

  // ✅ Auto login check
  useEffect(() => {
    const savedUser = localStorage.getItem('username')
    if (savedUser) {
      router.push('/dm')
    }
  }, [])

  const getBorderColor = () => {
    if (username.length === 0) return 'border-zinc-300'
    if (!touched) return 'border-zinc-300'
    return isValid ? 'border-green-500' : 'border-red-500'
  }

  // ✅ Handle login
  const handleLogin = () => {
    setTouched(true)

    if (!isValid) return

    localStorage.setItem('username', username)
    router.push('/dm')
  }

  return (
    <div className='bg-zinc-900 w-screen min-h-screen flex flex-col justify-center items-center text-white'>
      
      <img src="logo.jpg" alt="log" className='w-20 sm:w-25 mb-4 rounded-full' />

      <div className="log w-[80%] sm:w-[20%] h-fit flex flex-col justify-center items-start bg-zinc-950 p-4 sm:items-center rounded-xl">
        
        <p className='text-2xl font-extrabold text-zinc-300 sm:text-5xl'>Login</p>
        <p className='text-xs text-zinc-600 sm:text-sm'>
          Login to Coconut Chats to start enjoying it !
        </p>

        {/* USERNAME */}
        <div className="ust mt-5 w-full">
          <Label className='text-zinc-200 sm:text-xl'>Username:</Label>

          <Input
            placeholder='Enter username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`mt-2 border ${getBorderColor()} outline-none px-3 py-2 rounded focus:outline-none focus:ring-0`}
          />

          {touched && !isValid && username.length > 0 && (
            <p className='text-xs p-2 bg-emerald-900 border-emerald-500 border-2 rounded-sm mt-2 text-emerald-300'>
              Username must have more than 3 characters!
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="pswrd w-full mt-3">
          <Label className='text-zinc-200 sm:text-xl'>Password:</Label>

          <div className="relative mt-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter password'
              className='pr-10 outline-none px-3 py-2 rounded focus:outline-none focus:ring-0'
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <Button
          onClick={handleLogin}
          className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          Login
        </Button>

      </div>

      <p className='text-zinc-700 font-extralight mt-2'>
        Made by programmerAyush
      </p>
    </div>
  )
}

export default page