// Seed script for Firestore database
// Run with: node scripts/seed.js

import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// ==================== DATA DEFINITIONS ====================

// System Config
const systemConfig = {
    game_rules: {
        star_value: 10000,
        battle_cooldown_minutes: 15,
        challenge_timeout_seconds: 120, // 2 minutes for defender to respond
        max_territory_stars: 3, // Maximum stars a territory can have
        rank_thresholds: {
            rising_star: { followers: 100000, stars: 3, territories: 3 },
            legend: { followers: 1000000, stars: 10, fan_fav: 1 }
        }
    }
}

// Teams
const teams = {
    team_red: {
        name: "Team Red",
        color: "#EF4444",
        followers: 30000,
        rank: "Rookie",
        territory_count: 2,
        fan_favourites: [],
        avatar_url: ""
    },
    team_orange: {
        name: "Team Orange",
        color: "#F97316",
        followers: 25000,
        rank: "Rookie",
        territory_count: 1,
        fan_favourites: [],
        avatar_url: ""
    },
    team_yellow: {
        name: "Team Yellow",
        color: "#EAB308",
        followers: 28000,
        rank: "Rookie",
        territory_count: 1,
        fan_favourites: [],
        avatar_url: ""
    },
    team_green: {
        name: "Team Green",
        color: "#22C55E",
        followers: 32000,
        rank: "Rookie",
        territory_count: 1,
        fan_favourites: [],
        avatar_url: ""
    },
    team_blue: {
        name: "Team Blue",
        color: "#3B82F6",
        followers: 35000,
        rank: "Rookie",
        territory_count: 2,
        fan_favourites: ["game_japan"],
        avatar_url: ""
    },
    team_purple: {
        name: "Team Purple",
        color: "#A855F7",
        followers: 27000,
        rank: "Rookie",
        territory_count: 1,
        fan_favourites: [],
        avatar_url: ""
    }
}

// Locations
const locations = {
    loc_01: {
        name: "Vocal Room",
        image_url: "",
        type: "territory",
        assigned_game_id: "t_01"
    },
    loc_02: {
        name: "Dance Studio",
        image_url: "",
        type: "territory",
        assigned_game_id: "t_02"
    },
    loc_03: {
        name: "Recording Booth",
        image_url: "",
        type: "territory",
        assigned_game_id: "t_03"
    },
    loc_04: {
        name: "Rooftop Garden",
        image_url: "",
        type: "territory",
        assigned_game_id: "t_04"
    },
    loc_05: {
        name: "Cafeteria",
        image_url: "",
        type: "world_tour",
        assigned_game_id: "game_japan"
    },
    loc_06: {
        name: "Library",
        image_url: "",
        type: "territory",
        assigned_game_id: "t_05"
    }
}

// Territories
const territories = {
    t_01: {
        location_id: "loc_01",
        name: "Vocal Room",
        location_image_url: "",
        owner_id: "team_red",
        stars: 1,
        challenge_status: 'idle',  // 'idle' | 'requesting' | 'accepted'
        under_attack: false,  // Legacy, kept for compatibility
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Football Brawl",
            description_md: "## Rules\n\nFirst to score 2 goals wins!\n\n### Gameplay\n1. Each team takes turns shooting\n2. No hands allowed\n3. Standard football rules apply",
            win_condition: "First to 2 goals.",
            home_advantage: "Defender starts with ball possession.",
            has_timer: true,
            timer_duration_seconds: 150,
            timer_mode: "shared",  // 'shared' | 'split'
            has_scoreboard: true,
            score_unit: "Goals"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false,
            game_started: false,
            // Split timer fields
            attacker_elapsed_seconds: 0,
            defender_elapsed_seconds: 0,
            attacker_timer_started_at: null,
            defender_timer_started_at: null,
            // Voting fields
            end_game_requested_at: null,
            end_game_requester_id: null,
            attacker_vote: null,
            defender_vote: null,
            vote_mismatch: false
        }
    },
    t_02: {
        location_id: "loc_02",
        name: "Dance Studio",
        location_image_url: "",
        owner_id: "team_blue",
        stars: 2,
        challenge_status: 'idle',
        under_attack: false,
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Dance Battle",
            description_md: "## Rules\n\nBest of 3 dance rounds!\n\n### Judging\n- Style: 40%\n- Technique: 30%\n- Creativity: 30%",
            win_condition: "Best of 3 rounds.",
            home_advantage: "Defender picks first song.",
            has_timer: false,
            timer_duration_seconds: 0,
            timer_mode: "shared",
            has_scoreboard: true,
            score_unit: "Rounds"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false,
            game_started: false,
            attacker_elapsed_seconds: 0,
            defender_elapsed_seconds: 0,
            attacker_timer_started_at: null,
            defender_timer_started_at: null,
            end_game_requested_at: null,
            end_game_requester_id: null,
            attacker_vote: null,
            defender_vote: null,
            vote_mismatch: false
        }
    },
    t_03: {
        location_id: "loc_03",
        name: "Recording Booth",
        location_image_url: "",
        owner_id: "team_red",
        stars: 1,
        challenge_status: 'idle',
        under_attack: false,
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Trivia Challenge",
            description_md: "## Rules\n\nAnswer 5 questions correctly to win!\n\n### Categories\n- History\n- Science\n- Pop Culture",
            win_condition: "First to 5 correct answers.",
            home_advantage: "Defender gets 1 free pass.",
            has_timer: true,
            timer_duration_seconds: 30,
            timer_mode: "shared",
            has_scoreboard: true,
            score_unit: "Points"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false,
            game_started: false,
            attacker_elapsed_seconds: 0,
            defender_elapsed_seconds: 0,
            attacker_timer_started_at: null,
            defender_timer_started_at: null,
            end_game_requested_at: null,
            end_game_requester_id: null,
            attacker_vote: null,
            defender_vote: null,
            vote_mismatch: false
        }
    },
    t_04: {
        location_id: "loc_04",
        name: "Rooftop Garden",
        location_image_url: "",
        owner_id: "team_green",
        stars: 3,
        challenge_status: 'idle',
        under_attack: false,
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Hot Zone",
            description_md: "## Rules\n\nHold the flag in the hot zone!\n\n### Scoring\n- First to accumulate 100 seconds in the zone wins\n- Only one team can be in the zone at a time",
            win_condition: "First to 100 seconds in zone.",
            home_advantage: "Defender knows zone boundaries.",
            has_timer: true,
            timer_duration_seconds: 100,
            timer_mode: "split",
            has_scoreboard: false,
            score_unit: "Seconds"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false,
            game_started: false,
            attacker_elapsed_seconds: 0,
            defender_elapsed_seconds: 0,
            attacker_timer_started_at: null,
            defender_timer_started_at: null,
            end_game_requested_at: null,
            end_game_requester_id: null,
            attacker_vote: null,
            defender_vote: null,
            vote_mismatch: false
        }
    },
    t_05: {
        location_id: "loc_06",
        name: "Library",
        location_image_url: "",
        owner_id: "team_blue",
        stars: 1,
        challenge_status: 'idle',
        under_attack: false,
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Word Puzzle",
            description_md: "## Rules\n\nSolve the word puzzle the fastest!\n\n### Tips\n- Look for prefixes and suffixes\n- Common letters: E, T, A, O",
            win_condition: "First to solve puzzle.",
            home_advantage: "Defender gets hint.",
            has_timer: true,
            timer_duration_seconds: 120,
            timer_mode: "shared",
            has_scoreboard: false,
            score_unit: "Puzzles"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false,
            game_started: false,
            attacker_elapsed_seconds: 0,
            defender_elapsed_seconds: 0,
            attacker_timer_started_at: null,
            defender_timer_started_at: null,
            end_game_requested_at: null,
            end_game_requester_id: null,
            attacker_vote: null,
            defender_vote: null,
            vote_mismatch: false
        }
    }
}

// World Tour Games
const worldTourGames = {
    game_japan: {
        location_id: "loc_05",
        name: "Japan (Bean Sort)",
        location_image_url: "",
        high_score: 45,
        high_score_holder_id: "team_blue",
        multiplier_config: { normal: 1, hard: 2, extreme: 3 },
        description_md: "## How to Play\nSort the beans by color as fast as possible!",
        timer_config: {
            has_timer: true,
            duration_seconds: 60,
            type: "countdown"
        }
    },
    game_usa: {
        location_id: null,
        name: "USA (Hot Dog Stack)",
        location_image_url: "",
        high_score: 0,
        high_score_holder_id: null,
        multiplier_config: { normal: 1, hard: 2, extreme: 3 },
        description_md: "## How to Play\nStack as many hot dogs as possible!",
        timer_config: {
            has_timer: true,
            duration_seconds: 45,
            type: "countdown"
        }
    }
}

// ==================== SEEDING FUNCTIONS ====================

async function seedCollection(collectionName, data) {
    console.log(`\n📦 Seeding ${collectionName}...`)
    for (const [docId, docData] of Object.entries(data)) {
        try {
            await setDoc(doc(db, collectionName, docId), docData)
            console.log(`  ✅ ${docId}`)
        } catch (error) {
            console.error(`  ❌ ${docId}: ${error.message}`)
        }
    }
}

async function main() {
    console.log('🌱 Starting database seed...\n')

    // Authenticate anonymously
    try {
        await signInAnonymously(auth)
        console.log('✅ Authenticated anonymously\n')
    } catch (error) {
        console.error('❌ Authentication failed:', error.message)
        process.exit(1)
    }

    // Seed all collections
    await seedCollection('system_config', systemConfig)
    await seedCollection('teams', teams)
    await seedCollection('locations', locations)
    await seedCollection('territories', territories)
    await seedCollection('world_tour_games', worldTourGames)

    console.log('\n🎉 Database seeding complete!')
    process.exit(0)
}

main()
