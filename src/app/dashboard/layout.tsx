'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useThemeStore } from '@/lib/store'
import { motion } from 'framer-motion'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const { dark } = useThemeStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/sign-in')
  }, [])

  if (!isAuthenticated()) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        background: dark ? '#0a0a0a' : '#f0ede6',
        transition: 'background 0.4s',
      }}
    >
      {children}
    </motion.div>
  )
}
