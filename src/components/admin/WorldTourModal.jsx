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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Trash2, Loader2, RotateCcw, Eraser, ChevronsUpDown, Check, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { validateFormula } from '@/lib/formulaEvaluator'
import { Textarea } from '@/components/ui/textarea'

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
    const [scoreFormula, setScoreFormula] = useState('')

    // Multiplier config
    const [normalMultiplier, setNormalMultiplier] = useState(1)
    const [hardMultiplier, setHardMultiplier] = useState(2)
    const [extremeMultiplier, setExtremeMultiplier] = useState(3)

    const [saving, setSaving] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
    const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false)
    const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)
    const [formulaHelpOpen, setFormulaHelpOpen] = useState(false)

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
            setScoreFormula(game.game_info?.score_formula || '')
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
            setScoreFormula('')
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
        if (!hasScoreboard && !hasTimer) {
            toast.error('At least one tool (Scoreboard or Timer) must be enabled')
            return
        }
        if (scoreFormula.trim()) {
            const { valid, error } = validateFormula(scoreFormula)
            if (!valid) {
                toast.error(`Invalid formula: ${error}`)
                return
            }
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
                score_formula: scoreFormula.trim(),
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
                            <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={locationPopoverOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {locationId
                                            ? (() => {
                                                const loc = availableLocations.find(l => l.id === locationId)
                                                return loc ? `${loc.emoji || '🌍'} ${loc.name}` : 'Select location...'
                                            })()
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
                                                        {loc.emoji || '🌍'} {loc.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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

                        {/* Score Formula (visible when any tool is enabled) */}
                        {(hasScoreboard || hasTimer) && (
                            <div className="space-y-2">
                                <Label htmlFor="score-formula">Score Formula (optional)</Label>
                                <Textarea
                                    id="score-formula"
                                    value={scoreFormula}
                                    onChange={(e) => setScoreFormula(e.target.value)}
                                    placeholder="e.g., SCORE * 10 or IF(SCORE > 5, SCORE * 2, SCORE)"
                                    rows={2}
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">
                                        Use <code className="bg-muted px-1 rounded">SCORE</code> for the raw value.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-2 text-xs"
                                        onClick={() => setFormulaHelpOpen(true)}
                                    >
                                        <Info className="h-3 w-3 mr-1" /> Help
                                    </Button>
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

            {/* Score Formula Help Modal */}
            <Dialog open={formulaHelpOpen} onOpenChange={setFormulaHelpOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>📐 Score Formula Help</DialogTitle>
                        <DialogDescription>
                            Write an Excel-like formula to process the raw score before difficulty multipliers are applied.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 text-sm">
                        {/* Quick Start */}
                        <div className="space-y-2">
                            <h4 className="font-semibold">Quick Start</h4>
                            <p className="text-muted-foreground">
                                Use <code className="bg-muted px-1 rounded">SCORE</code> to reference the raw input value.
                            </p>
                            <div className="bg-muted p-2 rounded font-mono text-xs">
                                SCORE * 10 + 5
                            </div>
                        </div>

                        {/* Operators */}
                        <div className="space-y-2">
                            <h4 className="font-semibold">Operators</h4>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                <div><code className="font-mono">+</code> Addition</div>
                                <div><code className="font-mono">-</code> Subtraction</div>
                                <div><code className="font-mono">*</code> Multiplication</div>
                                <div><code className="font-mono">/</code> Division</div>
                                <div><code className="font-mono">^</code> Power</div>
                                <div><code className="font-mono">%</code> Modulo</div>
                            </div>
                        </div>

                        {/* Common Functions */}
                        <div className="space-y-2">
                            <h4 className="font-semibold">Common Functions</h4>
                            <div className="grid grid-cols-1 gap-1 text-xs">
                                <div><code className="font-mono">IF(cond, then, else)</code> — Conditional</div>
                                <div><code className="font-mono">SUM(a, b, ...)</code> — Sum values</div>
                                <div><code className="font-mono">ROUND(num, digits)</code> — Round number</div>
                                <div><code className="font-mono">FLOOR(num)</code> — Round down</div>
                                <div><code className="font-mono">CEILING(num)</code> — Round up</div>
                                <div><code className="font-mono">ABS(num)</code> — Absolute value</div>
                                <div><code className="font-mono">MIN(a, b, ...)</code> — Minimum</div>
                                <div><code className="font-mono">MAX(a, b, ...)</code> — Maximum</div>
                                <div><code className="font-mono">AVERAGE(a, b, ...)</code> — Average</div>
                                <div><code className="font-mono">MOD(num, divisor)</code> — Modulo</div>
                                <div><code className="font-mono">POWER(base, exp)</code> — Power</div>
                                <div><code className="font-mono">SQRT(num)</code> — Square root</div>
                            </div>
                        </div>

                        {/* Comparisons */}
                        <div className="space-y-2">
                            <h4 className="font-semibold">Comparisons (for IF)</h4>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                <div><code className="font-mono">=</code> Equal</div>
                                <div><code className="font-mono">{`<>`}</code> Not equal</div>
                                <div><code className="font-mono">{`>`}</code> Greater than</div>
                                <div><code className="font-mono">{`>=`}</code> Greater or equal</div>
                                <div><code className="font-mono">{`<`}</code> Less than</div>
                                <div><code className="font-mono">{`<=`}</code> Less or equal</div>
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="space-y-2">
                            <h4 className="font-semibold">Examples</h4>
                            <div className="space-y-1 text-xs text-muted-foreground">
                                <div><code className="bg-muted px-1 rounded">SCORE * 1000</code> — 1 bean = 1000 followers</div>
                                <div><code className="bg-muted px-1 rounded">{`IF(SCORE > 10, SCORE * 2, SCORE)`}</code> — Bonus if {`>`}10</div>
                                <div><code className="bg-muted px-1 rounded">SUM(SCORE * 1000, SCORE * 2000, SCORE * 5000)</code> — Tiered scoring</div>
                            </div>
                        </div>

                        {/* AI Help */}
                        <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                            <h4 className="font-semibold">🤖 Need Help?</h4>
                            <p className="text-xs text-muted-foreground">
                                Copy this prompt and ask an AI (ChatGPT, Claude, etc.):
                            </p>
                            <div className="bg-background p-2 rounded text-xs select-all border whitespace-pre-wrap font-mono">
                                {`# Task
Write an Excel-style formula for a game scoring system.

# Important
- This is NOT a spreadsheet. There are NO cell references (A1, B2, etc.)
- You have ONE variable: SCORE (the raw input number)
- Use ONLY: SCORE, numbers, operators, and the functions listed below

# Supported
- Functions: IF, SUM, ROUND, FLOOR, CEILING, ABS, MIN, MAX, AVERAGE, MOD, POWER, SQRT
- Operators: + - * / ^ %
- Comparisons: = <> > >= < <=

# My Scoring Rule
[Describe your rule here, e.g., "Double the score if over 10, otherwise keep it the same"]

# Output
Return ONLY the formula. No explanation. Example: IF(SCORE > 10, SCORE * 2, SCORE)`}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setFormulaHelpOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
