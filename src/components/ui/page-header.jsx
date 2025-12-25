import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * PageHeader - Sticky page header with back navigation and glassmorphism
 * @param {string} title - Main title text
 * @param {string} subtitle - Optional subtitle/description
 * @param {boolean} showBack - Show back button (default: true)
 * @param {string} backTo - Route to navigate back to (default: /dashboard)
 * @param {React.ReactNode} rightContent - Optional content on the right side
 */
export function PageHeader({
    title,
    subtitle,
    showBack = true,
    backTo = '/dashboard',
    rightContent,
    className
}) {
    const navigate = useNavigate()

    return (
        <div className={cn(
            'sticky top-0 z-40',
            'bg-background/80 backdrop-blur-md border-b',
            'px-4 py-3',
            className
        )}>
            <div className="flex items-center gap-3">
                {showBack && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => navigate(backTo)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                    )}
                </div>
                {rightContent && (
                    <div className="shrink-0">
                        {rightContent}
                    </div>
                )}
            </div>
        </div>
    )
}
