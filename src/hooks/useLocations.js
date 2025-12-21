import { useState, useEffect, useMemo } from 'react'
import { subscribeToAllLocations } from '@/services/gameService'

/**
 * Custom hook to fetch real-time data for all locations
 * @returns {Object} Locations array, locations map (keyed by ID), loading state, error
 */
export function useLocations() {
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const unsubscribe = subscribeToAllLocations(
            (locationsData) => {
                setLocations(locationsData)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    // Create a map keyed by location ID for O(1) lookups
    const locationsMap = useMemo(() => {
        const map = {}
        locations.forEach((location) => {
            map[location.id] = location
        })
        return map
    }, [locations])

    return { locations, locationsMap, loading, error }
}
