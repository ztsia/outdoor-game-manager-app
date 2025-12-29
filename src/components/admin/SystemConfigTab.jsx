import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, MapPin, Globe, Trophy, Calculator } from 'lucide-react'
import { toast } from 'sonner'

// Time options for selectors
const timeOptionsMinutes = [
    { label: '1 min', value: 1 },
    { label: '2 mins', value: 2 },
    { label: '5 mins', value: 5 },
    { label: '10 mins', value: 10 },
    { label: '15 mins', value: 15 },
    { label: '30 mins', value: 30 },
    { label: '60 mins', value: 60 },
]

const timeOptionsSeconds = [
    { label: '30 secs', value: 30 },
    { label: '1 min', value: 60 },
    { label: '2 mins', value: 120 },
    { label: '3 mins', value: 180 },
    { label: '5 mins', value: 300 },
]

export function SystemConfigTab() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        challenge_timeout_seconds: 120,
        battle_cooldown_minutes: 15,
        world_tour_cooldown_minutes: 15,
        max_territory_stars: 3,
        star_costs: { 0: 10000, 1: 50000, 2: 100000, 3: 500000 },
        rank_thresholds: {
            rookie: { min_followers: 10000, min_stars: 0 },
            rising_star: { min_followers: 100000, min_stars: 3 },
            legend: { min_followers: 1000000, min_stars: 10, min_fan_favourites: 1 }
        },
        rank_weights: {
            followers: 1,
            star: 20000,
            fan_favourite: 100000
        }
    })

    // Track which rank fields are enabled
    const [rankEnabled, setRankEnabled] = useState({
        rookie: { min_followers: true, min_stars: true, min_fan_favourites: false },
        rising_star: { min_followers: true, min_stars: true, min_fan_favourites: false },
        legend: { min_followers: true, min_stars: true, min_fan_favourites: true }
    })

    // Fetch config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configDoc = await getDoc(doc(db, 'system_config', 'game_rules'))
                if (configDoc.exists()) {
                    const data = configDoc.data()
                    setFormData(prev => ({
                        ...prev,
                        challenge_timeout_seconds: data.challenge_timeout_seconds ?? prev.challenge_timeout_seconds,
                        battle_cooldown_minutes: data.battle_cooldown_minutes ?? prev.battle_cooldown_minutes,
                        world_tour_cooldown_minutes: data.world_tour_cooldown_minutes ?? prev.world_tour_cooldown_minutes,
                        max_territory_stars: data.max_territory_stars ?? prev.max_territory_stars,
                        star_costs: data.star_costs ?? prev.star_costs,
                        rank_thresholds: data.rank_thresholds ?? prev.rank_thresholds,
                        rank_weights: data.rank_weights ?? prev.rank_weights
                    }))

                    // Determine enabled state from existing data
                    const thresholds = data.rank_thresholds || {}
                    setRankEnabled({
                        rookie: {
                            min_followers: thresholds.rookie?.min_followers != null,
                            min_stars: thresholds.rookie?.min_stars != null,
                            min_fan_favourites: thresholds.rookie?.min_fan_favourites != null
                        },
                        rising_star: {
                            min_followers: thresholds.rising_star?.min_followers != null,
                            min_stars: thresholds.rising_star?.min_stars != null,
                            min_fan_favourites: thresholds.rising_star?.min_fan_favourites != null
                        },
                        legend: {
                            min_followers: thresholds.legend?.min_followers != null,
                            min_stars: thresholds.legend?.min_stars != null,
                            min_fan_favourites: thresholds.legend?.min_fan_favourites != null
                        }
                    })
                }
            } catch (err) {
                console.error('[SystemConfigTab] Error fetching config:', err)
                toast.error('Failed to load configuration')
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    // Handle max stars change - adjust star_costs dynamically
    const handleMaxStarsChange = (value) => {
        const newMax = parseInt(value, 10)
        const newCosts = { ...formData.star_costs }

        // Add missing entries
        for (let i = 0; i <= newMax; i++) {
            if (newCosts[i] == null) {
                const prevCost = newCosts[i - 1] ?? 10000
                newCosts[i] = prevCost * 2
            }
        }

        // Remove excess entries
        Object.keys(newCosts).forEach(key => {
            if (parseInt(key, 10) > newMax) {
                delete newCosts[key]
            }
        })

        setFormData(prev => ({
            ...prev,
            max_territory_stars: newMax,
            star_costs: newCosts
        }))
    }

    // Handle star cost change
    const handleStarCostChange = (starIndex, value) => {
        const numValue = parseInt(value.replace(/,/g, ''), 10) || 0
        setFormData(prev => ({
            ...prev,
            star_costs: {
                ...prev.star_costs,
                [starIndex]: numValue
            }
        }))
    }

    // Handle rank threshold change
    const handleRankChange = (rank, field, value) => {
        const numValue = parseInt(value.replace(/,/g, ''), 10) || 0
        setFormData(prev => ({
            ...prev,
            rank_thresholds: {
                ...prev.rank_thresholds,
                [rank]: {
                    ...prev.rank_thresholds[rank],
                    [field]: numValue
                }
            }
        }))
    }

    // Toggle rank field enabled
    const toggleRankField = (rank, field) => {
        setRankEnabled(prev => ({
            ...prev,
            [rank]: {
                ...prev[rank],
                [field]: !prev[rank][field]
            }
        }))
    }

    // Save config
    const handleSave = async () => {
        setSaving(true)
        try {
            // Build rank_thresholds with only enabled fields
            const cleanThresholds = {}
            for (const rank of ['rookie', 'rising_star', 'legend']) {
                cleanThresholds[rank] = {}
                for (const field of ['min_followers', 'min_stars', 'min_fan_favourites']) {
                    if (rankEnabled[rank][field]) {
                        cleanThresholds[rank][field] = formData.rank_thresholds[rank]?.[field] ?? 0
                    }
                }
            }

            const updates = {
                challenge_timeout_seconds: formData.challenge_timeout_seconds,
                battle_cooldown_minutes: formData.battle_cooldown_minutes,
                world_tour_cooldown_minutes: formData.world_tour_cooldown_minutes,
                max_territory_stars: formData.max_territory_stars,
                star_costs: formData.star_costs,
                rank_thresholds: cleanThresholds,
                rank_weights: formData.rank_weights
            }

            await updateDoc(doc(db, 'system_config', 'game_rules'), updates)
            toast.success('Configuration saved!')
        } catch (err) {
            console.error('[SystemConfigTab] Error saving config:', err)
            toast.error('Failed to save configuration')
        } finally {
            setSaving(false)
        }
    }

    // Format number with commas
    const formatNumber = (num) => {
        return num?.toLocaleString() ?? ''
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4">
            {/* Territory Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Territory Settings
                    </CardTitle>
                    <CardDescription>
                        Configure battle mechanics and star costs
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Timeouts and Cooldowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Challenge Timeout</Label>
                            <Select
                                value={String(formData.challenge_timeout_seconds)}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, challenge_timeout_seconds: parseInt(v, 10) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptionsSeconds.map(opt => (
                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Time for defender to respond</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Battle Cooldown</Label>
                            <Select
                                value={String(formData.battle_cooldown_minutes)}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, battle_cooldown_minutes: parseInt(v, 10) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptionsMinutes.map(opt => (
                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Cooldown after battle ends</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Max Stars */}
                    <div className="space-y-2">
                        <Label>Max Territory Stars</Label>
                        <Select
                            value={String(formData.max_territory_stars)}
                            onValueChange={handleMaxStarsChange}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n} ⭐
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Star Costs */}
                    <div className="space-y-3">
                        <Label>Attack Cost by Stars</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Array.from({ length: formData.max_territory_stars + 1 }, (_, i) => (
                                <div key={i} className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{i} ⭐</Label>
                                    <Input
                                        type="text"
                                        value={formatNumber(formData.star_costs[i])}
                                        onChange={(e) => handleStarCostChange(i, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Follower cost to attack a territory with this many stars</p>
                    </div>
                </CardContent>
            </Card>

            {/* World Tour Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        World Tour Settings
                    </CardTitle>
                    <CardDescription>
                        Configure World Tour game mechanics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>Cooldown Between Games</Label>
                        <Select
                            value={String(formData.world_tour_cooldown_minutes)}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, world_tour_cooldown_minutes: parseInt(v, 10) }))}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {timeOptionsMinutes.map(opt => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Cooldown after completing a World Tour game</p>
                    </div>
                </CardContent>
            </Card>

            {/* Rank Thresholds Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Rank Thresholds
                    </CardTitle>
                    <CardDescription>
                        Define requirements for each rank. Uncheck to disable a requirement.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {[
                        { key: 'rookie', label: 'Rookie', emoji: '🌱' },
                        { key: 'rising_star', label: 'Rising Star', emoji: '⭐' },
                        { key: 'legend', label: 'Legend', emoji: '🏆' }
                    ].map(({ key, label, emoji }) => (
                        <div key={key} className="space-y-3">
                            <h4 className="font-semibold">{emoji} {label}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Min Followers */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`${key}-followers`}
                                            checked={rankEnabled[key].min_followers}
                                            onCheckedChange={() => toggleRankField(key, 'min_followers')}
                                        />
                                        <Label htmlFor={`${key}-followers`} className="text-sm">Min Followers</Label>
                                    </div>
                                    <Input
                                        type="text"
                                        value={formatNumber(formData.rank_thresholds[key]?.min_followers ?? 0)}
                                        onChange={(e) => handleRankChange(key, 'min_followers', e.target.value)}
                                        disabled={!rankEnabled[key].min_followers}
                                    />
                                </div>

                                {/* Min Stars */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`${key}-stars`}
                                            checked={rankEnabled[key].min_stars}
                                            onCheckedChange={() => toggleRankField(key, 'min_stars')}
                                        />
                                        <Label htmlFor={`${key}-stars`} className="text-sm">Min Stars</Label>
                                    </div>
                                    <Input
                                        type="text"
                                        value={formatNumber(formData.rank_thresholds[key]?.min_stars ?? 0)}
                                        onChange={(e) => handleRankChange(key, 'min_stars', e.target.value)}
                                        disabled={!rankEnabled[key].min_stars}
                                    />
                                </div>

                                {/* Min Fan Favourites */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`${key}-fav`}
                                            checked={rankEnabled[key].min_fan_favourites}
                                            onCheckedChange={() => toggleRankField(key, 'min_fan_favourites')}
                                        />
                                        <Label htmlFor={`${key}-fav`} className="text-sm">Min Fan Favourites</Label>
                                    </div>
                                    <Input
                                        type="text"
                                        value={formatNumber(formData.rank_thresholds[key]?.min_fan_favourites ?? 0)}
                                        onChange={(e) => handleRankChange(key, 'min_fan_favourites', e.target.value)}
                                        disabled={!rankEnabled[key].min_fan_favourites}
                                    />
                                </div>
                            </div>
                            {key !== 'legend' && <Separator />}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Rank Calculation Weights Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Rank Calculation Weights
                    </CardTitle>
                    <CardDescription>
                        Configure point values for calculating team scores
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Follower Weight</Label>
                            <Input
                                type="text"
                                value={formatNumber(formData.rank_weights.followers)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 0
                                    setFormData(prev => ({
                                        ...prev,
                                        rank_weights: { ...prev.rank_weights, followers: val }
                                    }))
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Points per follower</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Star Weight</Label>
                            <Input
                                type="text"
                                value={formatNumber(formData.rank_weights.star)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 0
                                    setFormData(prev => ({
                                        ...prev,
                                        rank_weights: { ...prev.rank_weights, star: val }
                                    }))
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Points per star owned</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Fan Favourite Weight</Label>
                            <Input
                                type="text"
                                value={formatNumber(formData.rank_weights.fan_favourite)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 0
                                    setFormData(prev => ({
                                        ...prev,
                                        rank_weights: { ...prev.rank_weights, fan_favourite: val }
                                    }))
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Points per fan favourite title</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Configuration
                </Button>
            </div>
        </div>
    )
}
