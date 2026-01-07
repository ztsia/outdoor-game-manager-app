import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import {
    subscribeToBlindBoxCodes,
    createBlindBoxCode,
    updateBlindBoxCode,
    toggleBlindBoxCodeStatus,
    deleteBlindBoxCode
} from '@/services/blindBoxService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'

export function BlindBoxTab() {
    const [codes, setCodes] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [editingRows, setEditingRows] = useState({})

    useEffect(() => {
        const unsubscribe = subscribeToBlindBoxCodes(
            (data) => {
                setCodes(data.sort((a, b) => b.created_at?.seconds - a.created_at?.seconds))
                setLoading(false)
            },
            (err) => {
                console.error('[BlindBoxTab] Error:', err)
                toast.error('Failed to load codes')
                setLoading(false)
            }
        )
        return () => unsubscribe()
    }, [])

    const handleAddRow = async () => {
        try {
            const newId = await createBlindBoxCode({
                code: '',
                amount: 0,
                outcome_description: ''
            })
            toast.success('New code row added')
            setEditingRows(prev => ({ ...prev, [newId]: true }))
        } catch (error) {
            console.error('Error adding row:', error)
            toast.error('Failed to add row')
        }
    }

    const handleFieldUpdate = async (id, field, value) => {
        try {
            await updateBlindBoxCode(id, { [field]: value })
        } catch (error) {
            console.error('Error updating field:', error)
            toast.error('Failed to update')
        }
    }

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'used' : 'active'
        try {
            await toggleBlindBoxCodeStatus(id, newStatus)
            toast.success(`Status changed to ${newStatus}`)
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error('Failed to toggle status')
        }
    }

    const handleDelete = async (id) => {
        try {
            await deleteBlindBoxCode(id)
            toast.success('Code deleted')
            setDeleteConfirm(null)
        } catch (error) {
            console.error('Error deleting code:', error)
            toast.error('Failed to delete code')
        }
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <p>Loading codes...</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">🎁 Blind Box Codes</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage promotional codes ({codes.length})
                    </p>
                </div>
                <Button onClick={handleAddRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Code
                </Button>
            </div>

            {/* Codes Table */}
            {codes.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-3 font-medium">Code</th>
                                    <th className="text-left p-3 font-medium">Amount</th>
                                    <th className="text-left p-3 font-medium">Outcome</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-right p-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {codes.map((code) => (
                                    <tr key={code.id} className="hover:bg-muted/50">
                                        {/* Code Input */}
                                        <td className="p-3">
                                            <Input
                                                value={code.code}
                                                onChange={(e) => handleFieldUpdate(code.id, 'code', e.target.value)}
                                                onBlur={() => setEditingRows(prev => ({ ...prev, [code.id]: false }))}
                                                onFocus={() => setEditingRows(prev => ({ ...prev, [code.id]: true }))}
                                                placeholder="Enter code"
                                                className="min-w-[150px]"
                                            />
                                        </td>

                                        {/* Amount Input */}
                                        <td className="p-3">
                                            <Input
                                                type="number"
                                                value={code.amount}
                                                onChange={(e) => handleFieldUpdate(code.id, 'amount', parseInt(e.target.value, 10) || 0)}
                                                onBlur={() => setEditingRows(prev => ({ ...prev, [code.id]: false }))}
                                                onFocus={() => setEditingRows(prev => ({ ...prev, [code.id]: true }))}
                                                className="min-w-[120px]"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {code.amount >= 0 ? `+${formatNumber(code.amount)}` : formatNumber(code.amount)}
                                            </p>
                                        </td>

                                        {/* Outcome Description */}
                                        <td className="p-3">
                                            <Textarea
                                                value={code.outcome_description}
                                                onChange={(e) => handleFieldUpdate(code.id, 'outcome_description', e.target.value)}
                                                onBlur={() => setEditingRows(prev => ({ ...prev, [code.id]: false }))}
                                                onFocus={() => setEditingRows(prev => ({ ...prev, [code.id]: true }))}
                                                placeholder="Outcome description"
                                                className="min-w-[200px] min-h-[60px] resize-none"
                                                rows={2}
                                            />
                                        </td>

                                        {/* Status Badge */}
                                        <td className="p-3">
                                            <Badge
                                                variant={code.status === 'active' ? 'default' : 'secondary'}
                                                className="cursor-pointer"
                                                onClick={() => handleToggleStatus(code.id, code.status)}
                                            >
                                                {code.status === 'active' ? (
                                                    <>
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="h-3 w-3 mr-1" />
                                                        Used
                                                    </>
                                                )}
                                            </Badge>
                                            {code.redeemed_by && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    By: {code.redeemed_by}
                                                </p>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteConfirm(code)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No codes yet. Click "Add Code" to create one.
                </p>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Code?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the code "{deleteConfirm?.code}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(deleteConfirm?.id)}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
