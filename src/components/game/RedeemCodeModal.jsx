import { useState } from 'react'
import { Gift, AlertCircle, PartyPopper, Bomb } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { redeemBlindBoxCode } from '@/services/blindBoxService'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'

/**
 * RedeemCodeModal - Allows team managers to redeem blind box codes
 */
export function RedeemCodeModal({ open, onOpenChange, teamId, onSuccess }) {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(null)

    const handleSubmit = async () => {
        if (!code.trim()) {
            setError('Please enter a code')
            return
        }

        setError('')
        setLoading(true)

        try {
            const result = await redeemBlindBoxCode(code, teamId)
            setSuccess(result)
            setCode('')
            toast.success('Code redeemed successfully!')
            if (onSuccess) onSuccess(result)
        } catch (err) {
            setError(err.message || 'Failed to redeem code')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setCode('')
        setError('')
        setSuccess(null)
        onOpenChange(false)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                {!success ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Gift className="h-5 w-5" />
                                Redeem Code
                            </DialogTitle>
                            <DialogDescription>
                                Enter your blind box code to claim your reward
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Redemption Code</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter code here"
                                    className="uppercase"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading || !code.trim()}>
                                {loading ? 'Validating...' : 'Redeem'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        {/* Success State - Conditional Styling */}
                        <DialogHeader className={success.amount >= 0 ? 'bg-green-50 dark:bg-green-950/30 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg' : 'bg-red-50 dark:bg-red-950/30 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg'}>
                            <DialogTitle className="flex items-center gap-2 justify-center text-center">
                                {success.amount >= 0 ? (
                                    <>
                                        <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        <span className="text-green-600 dark:text-green-400">Congratulations!</span>
                                    </>
                                ) : (
                                    <>
                                        <Bomb className="h-6 w-6 text-red-600 dark:text-red-400" />
                                        <span className="text-red-600 dark:text-red-400">Bad Luck!</span>
                                    </>
                                )}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-6 text-center space-y-4">
                            {/* Amount Display */}
                            <div className={`text-5xl font-black tracking-tighter ${success.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {success.amount >= 0 ? '+' : ''}{formatNumber(success.amount)}
                            </div>

                            {/* Outcome Description */}
                            <div className="bg-muted/50 rounded-lg p-4">
                                <p className="text-sm text-muted-foreground font-medium">
                                    {success.outcome_description || 'Your balance has been updated'}
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
