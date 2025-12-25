import { useNavigate } from 'react-router-dom'
import { Swords, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * NavFooter - Fixed bottom navigation bar with glassmorphism
 * Used in Dashboard for Attack/World Tour actions
 */
export function NavFooter({ className }) {
    const navigate = useNavigate()

    return (
        <div className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-background/80 backdrop-blur-md border-t shadow-lg',
            'p-4 safe-area-pb',
            className
        )}>
            <div className="flex gap-3 max-w-lg mx-auto">
                <Button
                    className="flex-1 h-14 text-lg gap-2 font-bold"
                    onClick={() => navigate('/attack')}
                >
                    <Swords className="h-5 w-5" />
                    ATTACK
                </Button>
                <Button
                    variant="secondary"
                    className="flex-1 h-14 text-lg gap-2 font-bold"
                    onClick={() => navigate('/world-tour')}
                >
                    <Globe className="h-5 w-5" />
                    WORLD TOUR
                </Button>
            </div>
        </div>
    )
}
