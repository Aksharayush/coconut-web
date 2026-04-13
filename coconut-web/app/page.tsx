'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    // 1. Define the timer
    const timer = setTimeout(() => {
      console.log("Redirecting...");
      router.push('/login'); 
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]); 

  return (
    <div className='bg-zinc-900 text-white w-screen min-h-screen flex flex-col justify-center items-center'>
      <img src="coconut.png" alt="lo" className='w-10 animate-bounce' />
      <p className='text-4xl font-extrabold mono text-zinc-700 sm:text-5xl'>Coco<span className='bg-zinc-700 rounded-2xl text-zinc-900 pl-2 pr-2 '>nut</span></p>
      <p className='text-zinc-700 mt-3 sm:text-xl'>Loading chats...</p>
    </div>
  )
}

export default Page