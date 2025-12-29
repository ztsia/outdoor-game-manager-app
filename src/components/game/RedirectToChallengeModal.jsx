import { useNavigate } from 'react-router-dom'
import { useTeamData } from '@/hooks/useTeamData'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TeamChip } from '@/components/ui/TeamChip'
import { Swords } from 'lucide-react'

/**
 * RedirectToChallengeModal - Undismissible modal shown after World Tour
 * when there's an accepted challenge waiting
 * 
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {Object} props.territory - Accepted challenge territory data
 */
export function RedirectToChallengeModal({ open, territory }) {
    const navigate = useNavigate()
    const { team: attackerTeam } = useTeamData(territory?.current_attacker_id)

    if (!open || !territory) return null

    const handleGoToBattle = () => {
        navigate(`/game/${territory.id}`)
    }

    return (
        <Dialog open={open}>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                hideCloseButton
            >
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Swords className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">
                        ⚔️ Challenge Ready!
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        You accepted a challenge. The attacker is waiting for you!
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg bg-muted p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Territory</p>
                    <p className="text-lg font-bold">{territory.name}</p>
                    {attackerTeam && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-sm text-muted-foreground">Attacker:</span>
                            <TeamChip name={attackerTeam.name} color={attackerTeam.color} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button className="w-full" onClick={handleGoToBattle}>
                        <Swords className="mr-2 h-4 w-4" />
                        Go to Battle
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
