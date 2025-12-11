import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Trophy } from 'lucide-react'

/**
 * RulesTab - Displays game rules, win condition, and home advantage
 * 
 * @param {Object} props
 * @param {Object} props.gameInfo - game_info from territory
 */
export function RulesTab({ gameInfo }) {
    if (!gameInfo) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                No game information available.
            </div>
        )
    }

    return (
        <div className="space-y-4 p-4">
            {/* Markdown Content */}
            <Card>
                <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{gameInfo.description_md || ''}</ReactMarkdown>
                </CardContent>
            </Card>

            {/* Win Condition Box */}
            {gameInfo.win_condition && (
                <Card className="border-2 border-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Trophy className="h-5 w-5 text-primary" />
                            Win Condition
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{gameInfo.win_condition}</p>
                    </CardContent>
                </Card>
            )}

            {/* Home Advantage Warning */}
            {gameInfo.home_advantage && (
                <Card className="border-2 border-destructive bg-destructive/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Home Advantage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-medium">{gameInfo.home_advantage}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
