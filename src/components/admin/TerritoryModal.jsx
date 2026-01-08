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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Trash2, Loader2, RotateCcw, ChevronsUpDown, Check, X, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuestionSetEditModal } from '@/components/admin/QuestionSetEditModal'

/**
 * TerritoryModal - Create/Edit/Delete territory with game info configuration
 */
export function TerritoryModal({
    open,
    onOpenChange,
    territory,
    locations,
    territories,
    maxStars = 3,
    onSave,
    onDelete,
    onReset
}) {
    const isEditMode = !!territory

    // Basic fields
    const [name, setName] = useState('')
    const [locationId, setLocationId] = useState('')
    const [stars, setStars] = useState(0)

    // Game info fields
    const [descriptionMd, setDescriptionMd] = useState('')
    const [winCondition, setWinCondition] = useState('')
    const [homeAdvantage, setHomeAdvantage] = useState('')
    const [hasScoreboard, setHasScoreboard] = useState(false)
    const [scoreUnit, setScoreUnit] = useState('Points')
    const [hasTimer, setHasTimer] = useState(false)
    const [timerMode, setTimerMode] = useState('countdown')
    const [timerDuration, setTimerDuration] = useState(60)

    // Q&A fields
    const [hasQA, setHasQA] = useState(false)
    const [questionSets, setQuestionSets] = useState([])
    const [editingQuestionSet, setEditingQuestionSet] = useState(null)
    const [questionSetModalOpen, setQuestionSetModalOpen] = useState(false)

    const [saving, setSaving] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
    const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)

    // Filter available locations (territory type, not taken or current territory)
    const availableLocations = locations.filter(loc => {
        if (loc.type !== 'territory') return false
        // Available if no assigned_game_id OR it's assigned to current territory
        if (!loc.assigned_game_id) return true
        if (isEditMode && loc.assigned_game_id === territory.id) return true
        return false
    })

    // Populate form when editing
    useEffect(() => {
        if (territory) {
            setName(territory.name || '')
            setLocationId(territory.location_id || '')
            setStars(territory.stars ?? 0)
            setDescriptionMd(territory.game_info?.description_md || '')
            setWinCondition(territory.game_info?.win_condition || '')
            setHomeAdvantage(territory.game_info?.home_advantage || '')
            setHasScoreboard(territory.game_info?.has_scoreboard || false)
            setScoreUnit(territory.game_info?.score_unit || 'Points')
            setHasTimer(territory.game_info?.has_timer || false)
            setTimerMode(territory.game_info?.timer_mode || 'countdown')
            setTimerDuration(territory.game_info?.timer_duration_seconds || 60)
            setHasQA(territory.game_info?.has_qa || false)
            setQuestionSets(territory.game_info?.question_sets || [])
        } else {
            // Reset for create mode
            setName('')
            setLocationId('')
            setStars(0)
            setDescriptionMd('')
            setWinCondition('')
            setHomeAdvantage('')
            setHasScoreboard(false)
            setScoreUnit('Points')
            setHasTimer(false)
            setTimerMode('countdown')
            setTimerDuration(60)
            setHasQA(false)
            setQuestionSets([])
        }
    }, [territory, open])

    // Generate star options based on maxStars
    const starOptions = Array.from({ length: maxStars + 1 }, (_, i) => i)

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }
        if (!locationId && !isEditMode) {
            toast.error('Location is required')
            return
        }

        setSaving(true)
        try {
            await onSave({
                location_id: locationId,
                name: name.trim(),
                stars,
                description_md: descriptionMd,
                win_condition: winCondition.trim(),
                home_advantage: homeAdvantage.trim(),
                has_scoreboard: hasScoreboard,
                score_unit: scoreUnit.trim() || 'Points',
                has_timer: hasTimer,
                timer_mode: timerMode,
                timer_duration_seconds: parseInt(timerDuration, 10) || 60,
                has_qa: hasQA,
                question_sets: questionSets
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
            toast.success('Territory state reset!')
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
                                    {isEditMode ? 'Edit Territory' : 'Add Territory'}
                                </DialogTitle>
                                <DialogDescription>
                                    {isEditMode
                                        ? `Editing ${territory?.id}`
                                        : 'Create a new territory game.'}
                                </DialogDescription>
                            </div>
                            {isEditMode && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResetConfirmOpen(true)}
                                    disabled={saving}
                                    className="gap-1"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset State
                                </Button>
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
                                placeholder="e.g., Football Brawl"
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label>Location *</Label>
                            <div className="flex gap-2">
                                <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={locationPopoverOpen}
                                            className="flex-1 justify-between font-normal"
                                        >
                                            {locationId
                                                ? availableLocations.find(loc => loc.id === locationId)?.name || 'Select location...'
                                                : 'Select location...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search locations..." />
                                            <CommandList>
                                                <CommandEmpty>No location found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableLocations.map(loc => (
                                                        <CommandItem
                                                            key={loc.id}
                                                            value={loc.name}
                                                            onSelect={() => {
                                                                setLocationId(loc.id)
                                                                setLocationPopoverOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    locationId === loc.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {loc.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {locationId && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setLocationId('')}
                                        title="Clear location"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {availableLocations.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No available territory locations. Create a new location first.
                                </p>
                            )}
                        </div>

                        {/* Stars */}
                        <div className="space-y-2">
                            <Label>Stars (0-{maxStars})</Label>
                            <ToggleGroup
                                type="single"
                                value={String(stars)}
                                onValueChange={(val) => val !== undefined && setStars(parseInt(val, 10))}
                                className="justify-start flex-wrap"
                            >
                                {starOptions.map(n => (
                                    <ToggleGroupItem key={n} value={String(n)}>
                                        {n === 0 ? '🚫' : '⭐'.repeat(n)} {n}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
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

                        {/* Win Condition */}
                        <div className="space-y-2">
                            <Label htmlFor="win-condition">Win Condition</Label>
                            <Textarea
                                id="win-condition"
                                value={winCondition}
                                onChange={(e) => setWinCondition(e.target.value)}
                                placeholder="e.g., First to 2 goals."
                                rows={2}
                            />
                        </div>

                        {/* Home Advantage */}
                        <div className="space-y-2">
                            <Label htmlFor="home-advantage">Home Advantage</Label>
                            <Textarea
                                id="home-advantage"
                                value={homeAdvantage}
                                onChange={(e) => setHomeAdvantage(e.target.value)}
                                placeholder="e.g., Defender starts with ball possession."
                                rows={2}
                            />
                        </div>

                        <hr className="my-4" />

                        {/* Scoreboard Toggle */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="has-scoreboard"
                                checked={hasScoreboard}
                                onCheckedChange={(checked) => {
                                    setHasScoreboard(checked)
                                    if (checked) setHasQA(false) // Mutual exclusion
                                }}
                                disabled={hasQA}
                            />
                            <Label htmlFor="has-scoreboard" className={hasQA ? 'text-muted-foreground' : ''}>
                                Enable Scoreboard {hasQA && '(disable Q&A first)'}
                            </Label>
                        </div>

                        {hasScoreboard && (
                            <div className="space-y-2 pl-6">
                                <Label htmlFor="score-unit">Score Unit</Label>
                                <Input
                                    id="score-unit"
                                    value={scoreUnit}
                                    onChange={(e) => setScoreUnit(e.target.value)}
                                    placeholder="e.g., Goals, Points, Rounds"
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
                                        <ToggleGroupItem value="split">🏁 Split</ToggleGroupItem>
                                    </ToggleGroup>
                                </div>

                                {timerMode !== 'stopwatch' && (
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
                                )}
                            </div>
                        )}

                        {/* Q&A Toggle */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="has-qa"
                                checked={hasQA}
                                onCheckedChange={(checked) => {
                                    setHasQA(checked)
                                    if (checked) setHasScoreboard(false) // Mutual exclusion
                                }}
                                disabled={hasScoreboard}
                            />
                            <Label htmlFor="has-qa" className={hasScoreboard ? 'text-muted-foreground' : ''}>
                                Enable Q&A Mode {hasScoreboard && '(disable scoreboard first)'}
                            </Label>
                        </div>

                        {hasQA && (
                            <div className="space-y-3 pl-6">
                                <div className="flex items-center justify-between">
                                    <Label>Question Sets</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => {
                                            setEditingQuestionSet(null)
                                            setQuestionSetModalOpen(true)
                                        }}
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add Set
                                    </Button>
                                </div>

                                {questionSets.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No question sets yet. Add one to get started.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {questionSets.map((set, index) => (
                                            <div
                                                key={set.id}
                                                className="flex items-center justify-between p-3 rounded-md border bg-muted/50"
                                            >
                                                <span className="text-sm">
                                                    {set.name || 'Unnamed Set'}: {set.questions?.length || 0} questions
                                                </span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setEditingQuestionSet(set)
                                                            setQuestionSetModalOpen(true)
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => {
                                                            setQuestionSets(questionSets.filter(s => s.id !== set.id))
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
                                disabled={!name.trim() || (!locationId && !isEditMode) || saving}
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
                        <AlertDialogTitle>Delete Territory?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{territory?.name}". This action cannot be undone.
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
                        <AlertDialogTitle>Reset Territory State?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the game state to idle, clearing any active challenges, scores, and timers. Use this if the game is stuck.
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

            {/* Question Set Edit Modal */}
            <QuestionSetEditModal
                open={questionSetModalOpen}
                onOpenChange={setQuestionSetModalOpen}
                questionSet={editingQuestionSet}
                onSave={(savedSet) => {
                    if (editingQuestionSet) {
                        // Update existing set
                        setQuestionSets(questionSets.map(s =>
                            s.id === savedSet.id ? savedSet : s
                        ))
                    } else {
                        // Add new set
                        setQuestionSets([...questionSets, savedSet])
                    }
                }}
            />
        </>
    )
}
