import { createContext, useContext, useState, useEffect } from 'react'
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/firebase'

// Secret codes mapped to roles, team IDs, and themes
const AUTH_CODES = {
    'HQ_SECRET': { role: 'HQ', teamId: null, theme: null },
    'ADMIN_SECRET': { role: 'ADMIN', teamId: null, theme: null },
    'RED_SECRET': { role: 'MANAGER', teamId: 'team_red', theme: 'theme-red' },
    'ORANGE_SECRET': { role: 'MANAGER', teamId: 'team_orange', theme: 'theme-orange' },
    'YELLOW_SECRET': { role: 'MANAGER', teamId: 'team_yellow', theme: 'theme-yellow' },
    'GREEN_SECRET': { role: 'MANAGER', teamId: 'team_green', theme: 'theme-green' },
    'BLUE_SECRET': { role: 'MANAGER', teamId: 'team_blue', theme: 'theme-blue' },
    'PURPLE_SECRET': { role: 'MANAGER', teamId: 'team_purple', theme: 'theme-purple' },
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
    const [theme, setTheme] = useState(null)
    const [loading, setLoading] = useState(true)

    // Restore session from localStorage on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                // Restore role/teamId/theme from localStorage
                const storedRole = localStorage.getItem('outdoor_game_role')
                const storedTeamId = localStorage.getItem('outdoor_game_teamId')
                const storedTheme = localStorage.getItem('outdoor_game_theme')
                if (storedRole) {
                    setRole(storedRole)
                    setTeamId(storedTeamId)
                    setTheme(storedTheme)
                }
            } else {
                setUser(null)
                setRole(null)
                setTeamId(null)
                setTheme(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Apply theme class to document root
    useEffect(() => {
        const root = document.documentElement
        // Remove all theme classes first
        root.classList.remove('theme-red', 'theme-orange', 'theme-yellow', 'theme-green', 'theme-blue', 'theme-purple')
        // Apply new theme if set
        if (theme) {
            root.classList.add(theme)
        }
    }, [theme])

    const login = async (accessCode) => {
        const authData = AUTH_CODES[accessCode.trim().toUpperCase()]
        if (!authData) {
            throw new Error('Invalid access code')
        }

        try {
            const userCredential = await signInAnonymously(auth)

            // Persist role/teamId/theme to localStorage
            localStorage.setItem('outdoor_game_role', authData.role)
            if (authData.teamId) {
                localStorage.setItem('outdoor_game_teamId', authData.teamId)
            } else {
                localStorage.removeItem('outdoor_game_teamId')
            }
            if (authData.theme) {
                localStorage.setItem('outdoor_game_theme', authData.theme)
            } else {
                localStorage.removeItem('outdoor_game_theme')
            }

            setRole(authData.role)
            setTeamId(authData.teamId)
            setTheme(authData.theme)

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
            localStorage.removeItem('outdoor_game_theme')
            setUser(null)
            setRole(null)
            setTeamId(null)
            setTheme(null)
        } catch (error) {
            console.error('Logout failed:', error)
            throw error
        }
    }

    const value = {
        user,
        role,
        teamId,
        theme,
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
