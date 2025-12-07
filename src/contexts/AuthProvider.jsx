import { createContext, useContext, useState, useEffect } from 'react'
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/firebase'

// Secret codes mapped to roles and team IDs
const AUTH_CODES = {
    'HQ_SECRET': { role: 'HQ', teamId: null },
    'ADMIN_SECRET': { role: 'ADMIN', teamId: null },
    'TEAM_A_SECRET': { role: 'MANAGER', teamId: 'team_a' },
    'TEAM_B_SECRET': { role: 'MANAGER', teamId: 'team_b' },
    'TEAM_C_SECRET': { role: 'MANAGER', teamId: 'team_c' },
    'TEAM_D_SECRET': { role: 'MANAGER', teamId: 'team_d' },
    'TEAM_E_SECRET': { role: 'MANAGER', teamId: 'team_e' },
    'TEAM_F_SECRET': { role: 'MANAGER', teamId: 'team_f' },
}

const AuthContext = createContext(null)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [teamId, setTeamId] = useState(null)
    const [loading, setLoading] = useState(true)

    // Restore session from localStorage on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                // Restore role/teamId from localStorage
                const storedRole = localStorage.getItem('outdoor_game_role')
                const storedTeamId = localStorage.getItem('outdoor_game_teamId')
                if (storedRole) {
                    setRole(storedRole)
                    setTeamId(storedTeamId)
                }
            } else {
                setUser(null)
                setRole(null)
                setTeamId(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const login = async (accessCode) => {
        const authData = AUTH_CODES[accessCode]
        if (!authData) {
            throw new Error('Invalid access code')
        }

        try {
            const userCredential = await signInAnonymously(auth)

            // Persist role/teamId to localStorage
            localStorage.setItem('outdoor_game_role', authData.role)
            if (authData.teamId) {
                localStorage.setItem('outdoor_game_teamId', authData.teamId)
            } else {
                localStorage.removeItem('outdoor_game_teamId')
            }

            setRole(authData.role)
            setTeamId(authData.teamId)

            console.log(`Logged in as ${authData.role}${authData.teamId ? ` for ${authData.teamId}` : ''}`)

            return userCredential.user
        } catch (error) {
            console.error('Login failed:', error)
            throw error
        }
    }

    const logout = async () => {
        try {
            await signOut(auth)
            localStorage.removeItem('outdoor_game_role')
            localStorage.removeItem('outdoor_game_teamId')
            setUser(null)
            setRole(null)
            setTeamId(null)
        } catch (error) {
            console.error('Logout failed:', error)
            throw error
        }
    }

    const value = {
        user,
        role,
        teamId,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!role,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
