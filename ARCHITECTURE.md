# Kingdom-Next Architecture

This document provides an overview of the Kingdom-Next project architecture, including its technical stack, database structure, game mechanics, and codebase organization.

## Technical Stack

- **Frontend**: Next.js (React framework)
- **Styling**: Custom CSS with minimalist black and white design
- **Authentication & Database**: Supabase
- **Deployment**: Vercel (https://kingdom-next.vercel.app/)

## Database Configuration

- **Supabase Project URL**: https://iajhforizmdqzyzvfiqu.supabase.co
- **Tables**:
  - `game_states`: Stores player kingdom data
  - `war_reports`: Stores results of battles between kingdoms

## Project Structure

```
Kingdom-Next/
├── components/            # UI components
│   ├── LoadingScreen.js   # Loading screen component
│   ├── Notification.js    # Notification component
│   ├── modals/            # Modal components
│   └── tabs/              # Game tab components
│       ├── ArmyTab.js     # Army management tab
│       ├── KingdomTab.js  # Kingdom overview tab
│       ├── ResourcesTab.js # Resources management tab
│       ├── WarTab.js      # War reports tab
│       └── WorldTab.js    # World map and PvP tab
├── contexts/
│   └── GameContext.js     # Game state management context
├── lib/
│   └── supabase.js        # Supabase client configuration
├── pages/
│   ├── _app.js            # Next.js app wrapper
│   ├── index.js           # Main game page
│   ├── login.js           # Login page
│   └── register.js        # Registration page
└── styles/
    └── globals.css        # Global styles
```

## Authentication System

The game uses Supabase Authentication with a simplified login flow:

1. **Registration**: Users provide a name and password
   - A deterministic email is generated from the name (`name@kingdom-game.com`)
   - This email is used internally for Supabase authentication

2. **Login**: Users log in with name and password
   - The name is converted to the same deterministic email format
   - Credentials are verified against Supabase Auth

3. **Guest Mode**: Users can play as guests
   - Random credentials are generated and stored in Supabase
   - Users are automatically logged in with these credentials

## Game State Management

The game uses React Context API (GameContext) to manage the game state:

1. **Initial Load**:
   - Check for existing user session
   - Fetch game state from Supabase
   - If no game state exists, create a new kingdom

2. **State Updates**:
   - All game actions update the local state
   - Changes are synchronized with Supabase
   - Real-time updates are managed through state hooks

## Game Mechanics

### Kingdom Management

- **Buildings**:
  - Castle: Provides defense bonus
  - Barracks: Increases training speed
  - Farm: Produces food
  - Mine: Produces gold

- **Building Upgrades**:
  - Each building can be upgraded with gold
  - Upgrade costs increase exponentially
  - Higher levels provide better bonuses

### Resource Management

- **Resources**:
  - Gold: Primary currency for building and training
  - Food: Required for training and maintaining troops

- **Resource Collection**:
  - Resources accumulate over time based on building levels
  - Collection is calculated based on time elapsed since last collection
  - Resources are automatically collected on login and periodically

### Army Management

- **Unit Types**:
  - Swordsmen: Basic infantry (1 attack power)
  - Archers: Ranged units (1.5 attack power)
  - Cavalry: Mobile units (3 attack power)
  - Catapults: Siege weapons (5 attack power)

- **Training**:
  - Units require gold and food to train
  - Training is instant but limited by resources

### Combat System

1. **Attack Initiation**:
   - Player selects a target kingdom in the World tab
   - Attack is processed by the `attackKingdom()` function

2. **Attack Resolution**:
   - Attack power is calculated based on army composition
   - Defense power includes castle defense bonus
   - Attack/defense ratio determines outcome

3. **Battle Results**:
   - Gold is stolen based on the attack/defense ratio
   - No gold stolen if ratio < 1
   - Up to 100% gold stolen if ratio ≥ 2
   - Linear scaling for ratios between 1 and 2

4. **War Reports**:
   - Results are stored in the `war_reports` table
   - Players can view reports in the War tab

### PVP Attack System

- **Target Kingdom Impact**:
  - Target player loses gold when successfully attacked
  - Changes are saved to the target player's game state

## UI Design

The UI follows a minimalist black and white design:

- **Color Usage**:
  - Interface is strictly black and white
  - Colors are only used for numeric values
  - Positive numbers: Green (#009900)
  - Negative numbers: Red (#990000)
  - Neutral numbers: Blue (#000099)

- **Typography**:
  - Monospace font throughout
  - Minimal styling to create a "raw" appearance

- **Layout**:
  - Tab-based navigation
  - Simple bordered containers
  - No rounded corners or shadows

## Deployment

The application is deployed on Vercel and can be accessed at:
https://kingdom-next.vercel.app/

## Database Schema

### game_states Table
```
{
  user_id: string (primary key),
  kingdom_name: string,
  resources: {
    gold: number,
    food: number,
    wood: number,
    stone: number
  },
  buildings: {
    castle: { level: number, defense_bonus: number },
    barracks: { level: number, training_speed: number },
    farm: { level: number, food_production: number },
    mine: { level: number, gold_production: number }
  },
  army: {
    swordsmen: number,
    archers: number,
    cavalry: number,
    catapults: number
  },
  last_resource_collection: timestamp
}
```

### war_reports Table
```
{
  id: string (primary key),
  attacker_id: string (foreign key to game_states),
  defender_id: string (foreign key to game_states),
  attacker_name: string,
  defender_name: string,
  attacker_army: object,
  defender_army: object,
  attack_power: number,
  defense_power: number,
  gold_stolen: number,
  victory: boolean,
  created_at: timestamp
}
```
