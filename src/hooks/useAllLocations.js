import { useState, useEffect } from 'react'
import { subscribeToAllLocations } from '@/services/gameService'

/**
 * Custom hook to fetch real-time data for all locations
 * @returns {Object} Locations array, locationsMap, loading state, error
 */
export function useAllLocations() {
    const [locations, setLocations] = useState([])
    const [locationsMap, setLocationsMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const unsubscribe = subscribeToAllLocations(
            (locationsData) => {
                setLocations(locationsData)
                // Build map for quick lookup
                const map = {}
                locationsData.forEach(loc => {
                    map[loc.id] = loc
                })
                setLocationsMap(map)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    return { locations, locationsMap, loading, error }
}
