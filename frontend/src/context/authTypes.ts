import { createContext } from 'react'

export interface AuthUser {
  id: number
  name: string
  email: string
  account_type: string
  demo_ai_calls_used: number
  calorie_target: number | null
  tdee_kcal: number | null
  weight_target: number | null
  goal_type: string | null
  protein_target: number | null
  sex: string | null
  height_cm: number | null
  weight_kg: number | null
  birth_date: string | null
  language: string | null
}

export interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  showDemoModal: boolean
  setShowDemoModal: (v: boolean) => void
  login: (email: string, password: string) => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
