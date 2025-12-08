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
        under_attack: false,
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Football Brawl",
            description_md: "## Rules\nFirst to score 2 goals wins!",
            win_condition: "First to 2 goals.",
            home_advantage: "Defender starts with ball.",
            has_timer: true,
            timer_duration_seconds: 150,
            timer_type: "countdown",
            has_scoreboard: true,
            score_unit: "Goals"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false
        }
    },
    t_02: {
        location_id: "loc_02",
        name: "Dance Studio",
        location_image_url: "",
        owner_id: "team_blue",
        stars: 2,
        under_attack: false,
        cooldown_ends_at: Date.now() + (15 * 60 * 1000), // 15 minutes from now
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Dance Battle",
            description_md: "## Rules\nBest of 3 dance rounds!",
            win_condition: "Best of 3 rounds.",
            home_advantage: "Defender picks first song.",
            has_timer: false,
            timer_duration_seconds: 0,
            timer_type: "none",
            has_scoreboard: true,
            score_unit: "Rounds"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false
        }
    },
    t_03: {
        location_id: "loc_03",
        name: "Recording Booth",
        location_image_url: "",
        owner_id: "team_red",
        stars: 1,
        under_attack: true, // TEST: Battle in progress
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Trivia Challenge",
            description_md: "## Rules\nAnswer 5 questions correctly to win!",
            win_condition: "First to 5 correct answers.",
            home_advantage: "Defender gets 1 free pass.",
            has_timer: true,
            timer_duration_seconds: 30,
            timer_type: "per_question",
            has_scoreboard: true,
            score_unit: "Points"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false
        }
    },
    t_04: {
        location_id: "loc_04",
        name: "Rooftop Garden",
        location_image_url: "",
        owner_id: "team_green",
        stars: 3,
        under_attack: false,
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Capture the Flag",
            description_md: "## Rules\nCapture the enemy flag and return to base!",
            win_condition: "First to capture flag.",
            home_advantage: "Defender knows hiding spots.",
            has_timer: true,
            timer_duration_seconds: 300,
            timer_type: "countdown",
            has_scoreboard: false,
            score_unit: "Captures"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false
        }
    },
    t_05: {
        location_id: "loc_06",
        name: "Library",
        location_image_url: "",
        owner_id: "team_blue",
        stars: 1,
        under_attack: false,
        cooldown_ends_at: null,
        current_attacker_id: null,
        bet_amount: 0,
        game_info: {
            title: "Word Puzzle",
            description_md: "## Rules\nSolve the word puzzle the fastest!",
            win_condition: "First to solve puzzle.",
            home_advantage: "Defender gets hint.",
            has_timer: true,
            timer_duration_seconds: 120,
            timer_type: "countdown",
            has_scoreboard: false,
            score_unit: "Puzzles"
        },
        live_state: {
            attacker_score: 0,
            defender_score: 0,
            timer_started_at: null,
            is_paused: false
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
