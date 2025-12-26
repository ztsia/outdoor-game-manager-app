import { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RankBadge } from '@/components/game/RankBadge'
import { Trash2, Loader2, Plus, ArrowRightLeft, Star, MapPin, X } from 'lucide-react'
import { toast } from 'sonner'
import { determineBaseRank, isLivingIcon } from '@/services/rankService'

/**
 * Mini Territory Card for display in team modal
 */
function MiniTerritoryCard({ territory, location, onRemove, showRemove = false }) {
    return (
        <Card className="overflow-hidden p-0 gap-0">
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {location?.image_url ? (
                    <img
                        src={location.image_url}
                        alt={location.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <MapPin className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                )}
                <div className="absolute left-1 top-1 flex items-center gap-0.5 bg-black/50 text-yellow-400 px-1.5 py-0.5 rounded text-xs">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{territory.stars}</span>
                </div>
                {showRemove && (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); onRemove?.(territory.id) }}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
            <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{location?.name || territory.id}</p>
                <p className="text-xs text-muted-foreground truncate">{territory.name}</p>
            </CardContent>
        </Card>
    )
}

/**
 * Territory Selector Modal - for adding or transferring territories
 */
function TerritorySelectorModal({
    open,
    onOpenChange,
    territories,
    locationsMap,
    onSelect,
    title = 'Select Territory'
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {territories.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {territories.map(t => (
                            <div
                                key={t.id}
                                className="cursor-pointer hover:ring-2 hover:ring-primary rounded-lg transition-all"
                                onClick={() => { onSelect(t.id); onOpenChange(false) }}
                            >
                                <MiniTerritoryCard
                                    territory={t}
                                    location={locationsMap[t.location_id]}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        No territories available.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    )
}

/**
 * TeamModal - Create/Edit/Delete team with territories management
 */
export function TeamModal({
    open,
    onOpenChange,
    team,
    allTeams,
    allTerritories,
    locationsMap,
    systemConfig,
    onSave,
    onDelete,
    onAssignTerritory,
    onRemoveTerritory
}) {
    const isEditMode = !!team

    // Form state
    const [name, setName] = useState('')
    const [color, setColor] = useState('#888888')
    const [followers, setFollowers] = useState(0)

    const [saving, setSaving] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [addTerritoryOpen, setAddTerritoryOpen] = useState(false)
    const [transferTerritoryOpen, setTransferTerritoryOpen] = useState(false)

    // Territories owned by this team
    const ownedTerritories = useMemo(() => {
        if (!team) return []
        return allTerritories.filter(t => t.owner_id === team.id)
    }, [team, allTerritories])

    // Unowned territories (for Add)
    const unownedTerritories = useMemo(() => {
        return allTerritories.filter(t => !t.owner_id)
    }, [allTerritories])

    // Territories owned by other teams (for Transfer)
    const otherTeamsTerritories = useMemo(() => {
        if (!team) return []
        return allTerritories.filter(t => t.owner_id && t.owner_id !== team.id)
    }, [team, allTerritories])

    // Calculate dynamic rank based on current form values
    const dynamicRank = useMemo(() => {
        const fakeTeam = {
            id: team?.id || 'new_team',
            followers: parseInt(followers, 10) || 0,
            fan_favourites: team?.fan_favourites || []
        }
        return determineBaseRank(fakeTeam, ownedTerritories, systemConfig || {})
    }, [team, followers, ownedTerritories, systemConfig])

    // Check if this team is living icon
    const isTeamLivingIcon = useMemo(() => {
        if (!team || !isEditMode) return false
        const fakeTeam = {
            ...team,
            followers: parseInt(followers, 10) || 0
        }
        return isLivingIcon(fakeTeam, ownedTerritories, allTeams, allTerritories, systemConfig || {})
    }, [team, followers, ownedTerritories, allTeams, allTerritories, systemConfig, isEditMode])

    // Populate form
    useEffect(() => {
        if (team) {
            setName(team.name || '')
            setColor(team.color || '#888888')
            setFollowers(team.followers || 0)
        } else {
            setName('')
            setColor('#888888')
            setFollowers(0)
        }
    }, [team, open])

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }

        setSaving(true)
        try {
            await onSave({
                name: name.trim(),
                color,
                followers: parseInt(followers, 10) || 0
            })
            onOpenChange(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleteConfirmOpen(false)
        setSaving(true)
        try {
            await onDelete()
            onOpenChange(false)
        } finally {
            setSaving(false)
        }
    }

    const handleAddTerritory = async (territoryId) => {
        setSaving(true)
        try {
            await onAssignTerritory(territoryId, team.id)
            toast.success('Territory added!')
        } finally {
            setSaving(false)
        }
    }

    const handleTransferTerritory = async (territoryId) => {
        setSaving(true)
        try {
            await onAssignTerritory(territoryId, team.id)
            toast.success('Territory transferred!')
        } finally {
            setSaving(false)
        }
    }

    const handleRemoveTerritory = async (territoryId) => {
        setSaving(true)
        try {
            await onRemoveTerritory(territoryId)
            toast.success('Territory removed!')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit Team' : 'Add Team'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode ? `Editing ${team?.id}` : 'Create a new team.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="team-name">Team Name *</Label>
                            <Input
                                id="team-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Red Dragons"
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <Label htmlFor="team-color">Team Color</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    id="team-color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border"
                                />
                                <Input
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-28 font-mono"
                                    placeholder="#888888"
                                />
                                <div
                                    className="w-8 h-8 rounded-full border"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        </div>

                        {/* Followers */}
                        <div className="space-y-2">
                            <Label htmlFor="team-followers">Followers</Label>
                            <Input
                                id="team-followers"
                                type="number"
                                value={followers}
                                onChange={(e) => setFollowers(e.target.value)}
                                placeholder="0"
                                min={0}
                            />
                        </div>

                        <hr className="my-4" />

                        {/* Rank Preview */}
                        <div className="space-y-2">
                            <Label>Rank (calculated)</Label>
                            <div className="flex items-center gap-2">
                                {dynamicRank ? (
                                    <RankBadge rank={dynamicRank} isLivingIcon={isTeamLivingIcon} />
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground">No Rank</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    ({ownedTerritories.reduce((sum, t) => sum + (t.stars || 0), 0)} stars from {ownedTerritories.length} territories)
                                </span>
                            </div>
                        </div>

                        {/* Territories Section - Only in Edit Mode */}
                        {isEditMode && (
                            <>
                                <hr className="my-4" />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Owned Territories ({ownedTerritories.length})</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAddTerritoryOpen(true)}
                                                disabled={saving || unownedTerritories.length === 0}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setTransferTerritoryOpen(true)}
                                                disabled={saving || otherTeamsTerritories.length === 0}
                                            >
                                                <ArrowRightLeft className="h-4 w-4 mr-1" />
                                                Transfer
                                            </Button>
                                        </div>
                                    </div>

                                    {ownedTerritories.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {ownedTerritories.map(t => (
                                                <MiniTerritoryCard
                                                    key={t.id}
                                                    territory={t}
                                                    location={locationsMap[t.location_id]}
                                                    showRemove
                                                    onRemove={handleRemoveTerritory}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No territories owned.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="flex-row justify-between sm:justify-between">
                        {isEditMode && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={saving}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!name.trim() || saving}
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? 'Save' : 'Create'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{team?.name}" and release all their territories.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Territory Modal */}
            <TerritorySelectorModal
                open={addTerritoryOpen}
                onOpenChange={setAddTerritoryOpen}
                territories={unownedTerritories}
                locationsMap={locationsMap}
                onSelect={handleAddTerritory}
                title="Add Unowned Territory"
            />

            {/* Transfer Territory Modal */}
            <TerritorySelectorModal
                open={transferTerritoryOpen}
                onOpenChange={setTransferTerritoryOpen}
                territories={otherTeamsTerritories}
                locationsMap={locationsMap}
                onSelect={handleTransferTerritory}
                title="Transfer Territory from Other Team"
            />
        </>
    )
}
