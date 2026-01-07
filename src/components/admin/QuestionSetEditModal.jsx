import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Loader2 } from 'lucide-react'

/**
 * QuestionSetEditModal - Create/Edit a question set
 * @param {Object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onOpenChange - Modal state change handler
 * @param {Object} props.questionSet - Existing question set to edit (null for new)
 * @param {Function} props.onSave - Callback with { id, questions } object
 */
export function QuestionSetEditModal({ open, onOpenChange, questionSet, onSave }) {
    const [questions, setQuestions] = useState([])
    const [saving, setSaving] = useState(false)

    // Initialize questions when modal opens
    useEffect(() => {
        if (open) {
            if (questionSet?.questions?.length > 0) {
                setQuestions([...questionSet.questions])
            } else {
                // Start with one empty question
                setQuestions([{ question: '', answer: '' }])
            }
        }
    }, [open, questionSet])

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: '', answer: '' }])
    }

    const handleRemoveQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index))
        }
    }

    const handleQuestionChange = (index, field, value) => {
        const updated = [...questions]
        updated[index] = { ...updated[index], [field]: value }
        setQuestions(updated)
    }

    const handleSave = async () => {
        // Filter out empty questions
        const validQuestions = questions.filter(q => q.question.trim() && q.answer.trim())

        if (validQuestions.length === 0) {
            return
        }

        setSaving(true)
        try {
            await onSave({
                id: questionSet?.id || crypto.randomUUID(),
                questions: validQuestions
            })
            onOpenChange(false)
        } finally {
            setSaving(false)
        }
    }

    const validCount = questions.filter(q => q.question.trim() && q.answer.trim()).length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {questionSet ? 'Edit Question Set' : 'New Question Set'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {questions.map((q, index) => (
                        <Card key={index} className="relative">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Question {index + 1}</Label>
                                            <Textarea
                                                value={q.question}
                                                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                                                placeholder="Enter question..."
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Answer</Label>
                                            <Input
                                                value={q.answer}
                                                onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                                                placeholder="Enter answer..."
                                            />
                                        </div>
                                    </div>
                                    {questions.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleRemoveQuestion(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleAddQuestion}
                    >
                        <Plus className="h-4 w-4" />
                        Add Question
                    </Button>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={validCount === 0 || saving}
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save ({validCount} questions)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
