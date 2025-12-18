import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Pencil, Star, Trophy, Swords, Globe, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useTeamData } from '@/hooks/useTeamData'
import { useRank } from '@/hooks/useRank'
import { RankBadge } from '@/components/game/RankBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { GameResultModal } from '@/components/dashboard/GameResultModal'

export default function Dashboard() {
    const { teamId, logout } = useAuth()
    const { team, territories, loading, updateTeamName } = useTeamData(teamId)
    const { rank, isLivingIcon } = useRank(teamId)
    const navigate = useNavigate()
    const location = useLocation()

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [newTeamName, setNewTeamName] = useState('')
    const [gameResult, setGameResult] = useState(null)

    // Check for game result from navigation state
    useEffect(() => {
        if (location.state?.gameResult) {
            setGameResult(location.state.gameResult)
            // Clear the state to prevent showing again on refresh
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    // Handle team name update
    const handleUpdateName = async () => {
        if (!newTeamName.trim()) {
            toast.error('Team name cannot be empty')
            return
        }
        try {
            await updateTeamName(newTeamName.trim())
            toast.success('Team name updated!')
            setEditDialogOpen(false)
            setNewTeamName('')
        } catch (error) {
            toast.error('Failed to update team name')
            console.error(error)
        }
    }

    // Open edit dialog with current name
    const openEditDialog = () => {
        setNewTeamName(team?.name || '')
        setEditDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
        )
    }

    if (!team) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Team not found.</p>
                        <Button variant="outline" className="mt-4" onClick={logout}>
                            Logout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Format followers count
    const formatFollowers = (count) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
        return count.toString()
    }

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Team Card */}
            <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{team.name}</h1>
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                                    onClick={openEditDialog}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Team Name</DialogTitle>
                                    <DialogDescription>
                                        Enter a new name for your team.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="teamName">Team Name</Label>
                                    <Input
                                        id="teamName"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        placeholder="Enter team name"
                                        className="mt-2"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdateName}>Save</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-4">
                    <p className="text-5xl font-bold">{formatFollowers(team.followers)}</p>
                    <p className="text-sm opacity-80">Followers</p>
                </div>

                <div className="mt-4">
                    <RankBadge rank={rank} isLivingIcon={isLivingIcon} />
                </div>
            </div>

            {/* Fan Favourites */}
            <div className="p-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Fan Favourites
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {team.fan_favourites && team.fan_favourites.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2">
                                {team.fan_favourites.map((gameId) => (
                                    <Badge key={gameId} variant="outline" className="shrink-0">
                                        🏆 {gameId.replace('game_', '').toUpperCase()}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No World Tour Records held yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* My Assets */}
            <div className="px-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-yellow-500" />
                            My Assets ({territories.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {territories.length > 0 ? (
                            <div className="space-y-2">
                                {territories.map((territory) => (
                                    <div
                                        key={territory.id}
                                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => navigate(`/game/${territory.id}`)}
                                    >
                                        <span className="font-medium">{territory.name}</span>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star className="h-4 w-4 fill-current" />
                                            <span className="font-bold">{territory.stars}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No territories owned yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-background p-4 shadow-lg border-t">
                <div className="flex gap-3">
                    <Button
                        className="flex-1 h-14 text-lg gap-2"
                        onClick={() => navigate('/attack')}
                    >
                        <Swords className="h-5 w-5" />
                        ATTACK
                    </Button>
                    <Button
                        variant="secondary"
                        className="flex-1 h-14 text-lg gap-2"
                        onClick={() => navigate('/world-tour')}
                    >
                        <Globe className="h-5 w-5" />
                        WORLD TOUR
                    </Button>
                </div>
            </div>

            {/* Game Result Modal */}
            {gameResult && (
                <GameResultModal
                    result={gameResult}
                    onClose={() => setGameResult(null)}
                />
            )}
        </div>
    )
}
