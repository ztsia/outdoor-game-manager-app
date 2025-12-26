import { useState, useEffect } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Trash2, Loader2, RotateCcw, Eraser } from 'lucide-react'
import { toast } from 'sonner'

/**
 * WorldTourModal - Create/Edit/Delete World Tour game with configuration
 */
export function WorldTourModal({
    open,
    onOpenChange,
    game,
    locations,
    onSave,
    onDelete,
    onReset,
    onCleanup
}) {
    const isEditMode = !!game

    // Basic fields
    const [name, setName] = useState('')
    const [locationId, setLocationId] = useState('')

    // Game info fields
    const [descriptionMd, setDescriptionMd] = useState('')
    const [hasScoreboard, setHasScoreboard] = useState(false)
    const [scoreUnit, setScoreUnit] = useState('Points')
    const [hasTimer, setHasTimer] = useState(false)
    const [timerMode, setTimerMode] = useState('countdown')
    const [timerDuration, setTimerDuration] = useState(60)

    // Multiplier config
    const [normalMultiplier, setNormalMultiplier] = useState(1)
    const [hardMultiplier, setHardMultiplier] = useState(2)
    const [extremeMultiplier, setExtremeMultiplier] = useState(3)

    const [saving, setSaving] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
    const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false)

    // Filter available locations (world_tour type, not taken or current game)
    const availableLocations = locations.filter(loc => {
        if (loc.type !== 'world_tour') return false
        // Available if no assigned_game_id OR it's assigned to current game
        if (!loc.assigned_game_id) return true
        if (isEditMode && loc.assigned_game_id === game.id) return true
        return false
    })

    // Populate form when editing
    useEffect(() => {
        if (game) {
            setName(game.name || '')
            setLocationId(game.location_id || '')
            setDescriptionMd(game.game_info?.description_md || '')
            setHasScoreboard(game.game_info?.has_scoreboard || false)
            setScoreUnit(game.game_info?.score_unit || 'Points')
            setHasTimer(game.game_info?.has_timer || false)
            setTimerMode(game.game_info?.timer_mode || 'countdown')
            setTimerDuration(game.game_info?.timer_duration_seconds || 60)
            setNormalMultiplier(game.multiplier_config?.normal ?? 1)
            setHardMultiplier(game.multiplier_config?.hard ?? 2)
            setExtremeMultiplier(game.multiplier_config?.extreme ?? 3)
        } else {
            // Reset for create mode
            setName('')
            setLocationId('')
            setDescriptionMd('')
            setHasScoreboard(false)
            setScoreUnit('Points')
            setHasTimer(false)
            setTimerMode('countdown')
            setTimerDuration(60)
            setNormalMultiplier(1)
            setHardMultiplier(2)
            setExtremeMultiplier(3)
        }
    }, [game, open])

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }
        if (!locationId) {
            toast.error('Location is required')
            return
        }

        setSaving(true)
        try {
            await onSave({
                location_id: locationId,
                name: name.trim(),
                description_md: descriptionMd,
                has_scoreboard: hasScoreboard,
                score_unit: scoreUnit.trim() || 'Points',
                has_timer: hasTimer,
                timer_mode: timerMode,
                timer_duration_seconds: parseInt(timerDuration, 10) || 60,
                multiplier_config: {
                    normal: parseFloat(normalMultiplier) || 1,
                    hard: parseFloat(hardMultiplier) || 2,
                    extreme: parseFloat(extremeMultiplier) || 3
                }
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

    const handleReset = async () => {
        setResetConfirmOpen(false)
        setSaving(true)
        try {
            await onReset()
            toast.success('Game state reset!')
        } finally {
            setSaving(false)
        }
    }

    const handleCleanup = async () => {
        setCleanupConfirmOpen(false)
        setSaving(true)
        try {
            await onCleanup()
            toast.success('Stats cleared!')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle>
                                    {isEditMode ? 'Edit World Tour Game' : 'Add World Tour Game'}
                                </DialogTitle>
                                <DialogDescription>
                                    {isEditMode
                                        ? `Editing ${game?.id}`
                                        : 'Create a new World Tour game.'}
                                </DialogDescription>
                            </div>
                            {isEditMode && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setResetConfirmOpen(true)}
                                        disabled={saving}
                                        className="gap-1"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCleanupConfirmOpen(true)}
                                        disabled={saving}
                                        className="gap-1"
                                    >
                                        <Eraser className="h-4 w-4" />
                                        Clear Stats
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Game Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Bean Sort"
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label>Location *</Label>
                            <Select value={locationId} onValueChange={setLocationId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableLocations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.emoji || '🌍'} {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {availableLocations.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No available World Tour locations. Create a new location first.
                                </p>
                            )}
                        </div>

                        <hr className="my-4" />

                        {/* Description (WYSIWYG Markdown Editor) */}
                        <div className="space-y-2">
                            <Label>Game Rules</Label>
                            <RichTextEditor
                                value={descriptionMd}
                                onChange={setDescriptionMd}
                                placeholder="Type your game rules here..."
                            />
                        </div>

                        <hr className="my-4" />

                        {/* Scoreboard Toggle */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="has-scoreboard"
                                checked={hasScoreboard}
                                onCheckedChange={setHasScoreboard}
                            />
                            <Label htmlFor="has-scoreboard">Enable Scoreboard</Label>
                        </div>

                        {hasScoreboard && (
                            <div className="space-y-2 pl-6">
                                <Label htmlFor="score-unit">Score Unit</Label>
                                <Input
                                    id="score-unit"
                                    value={scoreUnit}
                                    onChange={(e) => setScoreUnit(e.target.value)}
                                    placeholder="e.g., Beans, Points, Stacks"
                                />
                            </div>
                        )}

                        {/* Timer Toggle */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="has-timer"
                                checked={hasTimer}
                                onCheckedChange={setHasTimer}
                            />
                            <Label htmlFor="has-timer">Enable Timer</Label>
                        </div>

                        {hasTimer && (
                            <div className="space-y-4 pl-6">
                                <div className="space-y-2">
                                    <Label>Timer Mode</Label>
                                    <ToggleGroup
                                        type="single"
                                        value={timerMode}
                                        onValueChange={(val) => val && setTimerMode(val)}
                                        className="justify-start"
                                    >
                                        <ToggleGroupItem value="countdown">⏱️ Countdown</ToggleGroupItem>
                                        <ToggleGroupItem value="stopwatch">⏲️ Stopwatch</ToggleGroupItem>
                                    </ToggleGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timer-duration">Timer Duration (seconds)</Label>
                                    <Input
                                        id="timer-duration"
                                        type="number"
                                        value={timerDuration}
                                        onChange={(e) => setTimerDuration(e.target.value)}
                                        placeholder="60"
                                        min={1}
                                    />
                                </div>
                            </div>
                        )}

                        <hr className="my-4" />

                        {/* Difficulty Multipliers */}
                        <div className="space-y-3">
                            <Label>Difficulty Multipliers</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="normal-mult" className="text-sm text-muted-foreground">Normal</Label>
                                    <Input
                                        id="normal-mult"
                                        type="number"
                                        step="0.1"
                                        value={normalMultiplier}
                                        onChange={(e) => setNormalMultiplier(e.target.value)}
                                        placeholder="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="hard-mult" className="text-sm text-muted-foreground">Hard</Label>
                                    <Input
                                        id="hard-mult"
                                        type="number"
                                        step="0.1"
                                        value={hardMultiplier}
                                        onChange={(e) => setHardMultiplier(e.target.value)}
                                        placeholder="2"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="extreme-mult" className="text-sm text-muted-foreground">Extreme</Label>
                                    <Input
                                        id="extreme-mult"
                                        type="number"
                                        step="0.1"
                                        value={extremeMultiplier}
                                        onChange={(e) => setExtremeMultiplier(e.target.value)}
                                        placeholder="3"
                                    />
                                </div>
                            </div>
                        </div>
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
                                disabled={!name.trim() || !locationId || saving}
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
                        <AlertDialogTitle>Delete World Tour Game?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{game?.name}". This action cannot be undone.
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

            {/* Reset Confirmation */}
            <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Game State?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the live game state (clear cooldowns, current team, timers). Use this if the game is stuck.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>
                            Reset State
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cleanup Confirmation */}
            <AlertDialog open={cleanupConfirmOpen} onOpenChange={setCleanupConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Stats?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear all attempts, high scores, and remove the game from the high score holder's fan favourites. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCleanup}>
                            Clear Stats
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
