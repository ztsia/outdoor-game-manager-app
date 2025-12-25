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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Info, Trash2, Loader2, ChevronDown, ChevronUp, ImageOff } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { getGoogleDriveDirectLink } from '@/lib/utils'

/**
 * LocationModal - Create/Edit/Delete location
 * @param {Object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onOpenChange - Modal open state handler
 * @param {Object|null} props.location - Location to edit (null for create mode)
 * @param {Function} props.onSave - Callback with location data
 * @param {Function} props.onDelete - Callback to delete location
 */
export function LocationModal({ open, onOpenChange, location, onSave, onDelete }) {
    const isEditMode = !!location

    const [name, setName] = useState('')
    const [type, setType] = useState('territory')
    const [emoji, setEmoji] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [imageError, setImageError] = useState(false)

    // Populate form when editing
    useEffect(() => {
        if (location) {
            setName(location.name || '')
            setType(location.type || 'territory')
            setEmoji(location.emoji || '')
            setImageUrl(location.image_url || '')
        } else {
            // Reset for create mode
            setName('')
            setType('territory')
            setEmoji('')
            setImageUrl('')
        }
        setShowEmojiPicker(false)
        setImageError(false)
    }, [location, open])

    // Reset image error when URL changes
    useEffect(() => {
        setImageError(false)
    }, [imageUrl])

    const handleSave = async () => {
        if (!name.trim()) return

        setSaving(true)
        try {
            // Process Google Drive link before saving
            const processedImageUrl = getGoogleDriveDirectLink(imageUrl.trim())
            await onSave({
                name: name.trim(),
                type,
                emoji: type === 'world_tour' ? emoji : '',
                image_url: processedImageUrl
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

    const previewImageUrl = getGoogleDriveDirectLink(imageUrl.trim())

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit Location' : 'Add Location'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? `Editing ${location?.id}`
                                : 'Create a new location. ID will be auto-generated.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Tokyo Station"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label>Type *</Label>
                            <ToggleGroup
                                type="single"
                                value={type}
                                onValueChange={(val) => val && setType(val)}
                                className="justify-start"
                            >
                                <ToggleGroupItem value="territory" aria-label="Territory">
                                    🏰 Territory
                                </ToggleGroupItem>
                                <ToggleGroupItem value="world_tour" aria-label="World Tour">
                                    🌍 World Tour
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        {/* Country Emoji (only for World Tour) */}
                        {type === 'world_tour' && (
                            <div className="space-y-2">
                                <Label>Country Emoji</Label>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between text-2xl h-12"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    type="button"
                                >
                                    <span>{emoji || 'Select flag 🏳️'}</span>
                                    {showEmojiPicker ? (
                                        <ChevronUp className="h-4 w-4 ml-2" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    )}
                                </Button>
                                {showEmojiPicker && (
                                    <div className="border rounded-md overflow-hidden">
                                        <EmojiPicker
                                            onEmojiClick={(emojiData) => {
                                                setEmoji(emojiData.emoji)
                                                setShowEmojiPicker(false)
                                            }}
                                            categories={[
                                                { category: 'flags', name: 'Flags' }
                                            ]}
                                            searchPlaceholder="Search flags..."
                                            width="100%"
                                            height={300}
                                            skinTonesDisabled={true}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Alert className="mb-2">
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Upload images to{' '}
                                    <a
                                        href="https://drive.google.com/drive/folders/1NsdCz_GQw4MacYqJEQKCV6vGtiejtAGu?usp=sharing"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-primary"
                                    >
                                        this Google Drive folder
                                    </a>
                                    . Ensure the file is set to <strong>"Anyone with the link"</strong>.
                                </AlertDescription>
                            </Alert>
                            <Input
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://drive.google.com/file/d/.../view"
                            />

                            {/* Live Image Preview */}
                            {imageUrl.trim() && (
                                <div className="mt-3 border rounded-md overflow-hidden bg-muted">
                                    <p className="text-xs text-muted-foreground p-2 border-b">Preview</p>
                                    {imageError ? (
                                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                            <ImageOff className="h-8 w-8 mb-2" />
                                            <p className="text-sm">Failed to load image</p>
                                            <p className="text-xs">Check if file is set to "Anyone with the link"</p>
                                        </div>
                                    ) : (
                                        <img
                                            src={previewImageUrl}
                                            alt="Preview"
                                            className="w-full h-40 object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    )}
                                </div>
                            )}
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
                                disabled={!name.trim() || saving}
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
                        <AlertDialogTitle>Delete Location?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{location?.name}". This action cannot be undone.
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
        </>
    )
}
