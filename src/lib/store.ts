import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
  updateUser: (partial: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        Cookies.set('nn_token', token, { expires: 7 })
        set({ user, token })
      },

      logout: () => {
        Cookies.remove('nn_token')
        set({ user: null, token: null })
      },

      isAuthenticated: () => {
        const { token } = get()
        return !!token && !!Cookies.get('nn_token')
      },

      updateUser: (partial) => {
        const { user } = get()
        if (user) set({ user: { ...user, ...partial } })
      },
    }),
    {
      name: 'nn-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
