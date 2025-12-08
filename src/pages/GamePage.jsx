import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/contexts/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Swords, Shield, ArrowLeft, Loader2 } from 'lucide-react'

/**
 * GamePage - Placeholder for the actual game
 * Both attacker and defender navigate here after challenge is accepted
 */
export default function GamePage() {
    const { territoryId } = useParams()
    const navigate = useNavigate()
    const { teamId } = useAuth()
    const [territory, setTerritory] = useState(null)
    const [loading, setLoading] = useState(true)

    console.log('[GamePage] Mounted with territoryId:', territoryId)

    useEffect(() => {
        if (!territoryId) return

        const unsubscribe = onSnapshot(
            doc(db, 'territories', territoryId),
            (snapshot) => {
                if (snapshot.exists()) {
                    setTerritory({ id: snapshot.id, ...snapshot.data() })
                }
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [territoryId])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!territory) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Territory not found</p>
            </div>
        )
    }

    const isAttacker = territory.current_attacker_id === teamId
    const isDefender = territory.owner_id === teamId
    const role = isAttacker ? 'ATTACKER' : isDefender ? 'DEFENDER' : 'SPECTATOR'

    const attackerName = territory.current_attacker_id?.replace('team_', '').toUpperCase() || 'Unknown'
    const defenderName = territory.owner_id?.replace('team_', '').toUpperCase() || 'Unknown'

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Game Host</h1>
                        <p className="text-sm text-muted-foreground">{territory.name}</p>
                    </div>
                </div>

                {/* Role Badge */}
                <div className="text-center">
                    <Badge
                        variant={isAttacker ? 'destructive' : isDefender ? 'default' : 'secondary'}
                        className="text-lg px-4 py-2"
                    >
                        {role === 'ATTACKER' && <Swords className="mr-2 h-5 w-5" />}
                        {role === 'DEFENDER' && <Shield className="mr-2 h-5 w-5" />}
                        You are the {role}
                    </Badge>
                </div>

                {/* Matchup Card */}
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">⚔️ Battle Arena</CardTitle>
                        <CardDescription>{territory.game_info?.title || 'Unknown Game'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between text-center">
                            <div className="flex-1">
                                <Badge variant="destructive" className="mb-2">ATTACKER</Badge>
                                <p className="text-lg font-bold">{attackerName}</p>
                            </div>
                            <div className="text-2xl font-bold text-muted-foreground">VS</div>
                            <div className="flex-1">
                                <Badge variant="default" className="mb-2">DEFENDER</Badge>
                                <p className="text-lg font-bold">{defenderName}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-lg bg-muted p-4 text-center">
                            <p className="text-muted-foreground">🚧 Game interface coming soon</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {territory.game_info?.win_condition}
                            </p>
                        </div>

                        {/* Status Info */}
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            <p>Challenge Status: <Badge variant="outline">{territory.challenge_status}</Badge></p>
                            <p className="mt-1">Bet: {territory.bet_amount?.toLocaleString() || 0} followers</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Back Button */}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Dashboard
                </Button>
            </div>
        </div>
    )
}
