import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/lib/store'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'

let globalSocket: Socket | null = null

export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token) return

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
      })
    }

    socketRef.current = globalSocket

    return () => {
      // Keep socket alive for the session; don't disconnect on unmount
    }
  }, [token])

  return socketRef.current
}
