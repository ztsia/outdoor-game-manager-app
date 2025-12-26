import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Hook to subscribe to system_config/game_rules in real-time
 * @returns {Object} { config, loading }
 */
export function useSystemConfig() {
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'system_config', 'game_rules'),
            (snapshot) => {
                if (snapshot.exists()) {
                    setConfig(snapshot.data())
                } else {
                    setConfig({})
                }
                setLoading(false)
            },
            (err) => {
                console.error('[useSystemConfig] Error:', err)
                setConfig({})
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    return { config, loading }
}
