import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useWorldTourGames } from '@/hooks/useWorldTourGames'
import { useAllTeams } from '@/hooks/useAllTeams'
import { useLocations } from '@/hooks/useLocations'
import { getWorldTourStatus } from '@/lib/territoryStatus'
import { Button } from '@/components/ui/button'
import { GameCard } from '@/components/game/GameCard'

export default function WorldTour() {
    const navigate = useNavigate()
    const { games, loading: gamesLoading } = useWorldTourGames()
    const { teamsMap, loading: teamsLoading } = useAllTeams()
    const { locationsMap, loading: locationsLoading } = useLocations()

    // Real-time ticker for countdown timers
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const loading = gamesLoading || teamsLoading || locationsLoading

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading world tour games...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b p-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">World Tour 🌍</h1>
                        <p className="text-sm text-muted-foreground">
                            Non-PvP Challenges - Set high scores!
                        </p>
                    </div>
                </div>
            </div>

            {/* Games List */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => {
                    const status = getWorldTourStatus(game, now)
                    const highScoreTeam = teamsMap[game.high_score_holder_id]

                    return (
                        <GameCard
                            key={game.id}
                            territory={game}
                            status={status}
                            ownerTeam={highScoreTeam}
                            isWorldTour={true}
                            title={locationsMap[game.location_id]?.name || game.name}
                            onAction={() => {
                                if (status?.type === 'available') {
                                    navigate(`/game/${game.id}`)
                                }
                            }}
                        />
                    )
                })}
            </div>

            {games.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                    <p>No world tour games available.</p>
                </div>
            )}
        </div>
    )
}
