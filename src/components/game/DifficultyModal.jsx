import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * DifficultyModal - Modal for selecting game difficulty
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onOpenChange - Callback to change visibility
 * @param {Object} props.multiplierConfig - { normal: 1, hard: 2, extreme: 3 }
 * @param {function} props.onSelect - Callback when difficulty is selected
 */
export function DifficultyModal({
    open,
    onOpenChange,
    multiplierConfig = { normal: 1, hard: 2, extreme: 3 },
    onSelect
}) {
    const difficulties = [
        { key: 'normal', label: 'Normal', color: 'bg-green-500', emoji: '🌱' },
        { key: 'hard', label: 'Hard', color: 'bg-orange-500', emoji: '🔥' },
        { key: 'extreme', label: 'Extreme', color: 'bg-red-500', emoji: '💀' }
    ]

    const handleSelect = (difficulty) => {
        onSelect(difficulty)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Select Difficulty</DialogTitle>
                    <DialogDescription className="text-center">
                        Higher difficulty = Higher score multiplier!
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-4">
                    {difficulties.map((diff) => (
                        <Button
                            key={diff.key}
                            variant="outline"
                            className="h-auto py-4 flex items-center justify-between"
                            onClick={() => handleSelect(diff.key)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{diff.emoji}</span>
                                <span className="text-lg font-semibold">{diff.label}</span>
                            </div>
                            <Badge className={`${diff.color} text-white`}>
                                {multiplierConfig[diff.key]}x
                            </Badge>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
