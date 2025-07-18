# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Five Elements Card Battle Game** - A web-based strategic card game built with vanilla HTML, CSS, and JavaScript. The game features a unique battle system where players deploy cards in a 3vs3 format, with speed-based turn order similar to Final Fantasy X.

## Development Commands

### Running the Game
```bash
# Open index.html in a web browser
open index.html
# Or serve with a local server
python -m http.server 8000
```

### Testing & Debugging
- Open browser DevTools to monitor console logs
- Game includes extensive console logging for debugging attack system
- Message history panel shows game events for AI behavior verification

## Architecture Overview

### Core Game Systems

**State Management**: Centralized `gameState` object manages all game data including:
- Player/enemy hands, decks, and battlefield positions
- PP (Power Points) system with turn-based resource generation
- Phase-based turn structure (summon → battle → end)
- Attack mode states and message history

**Phase System**: Four distinct phases per turn:
1. **Summon Phase**: Players place cards from hand (PP cost)
2. **Battle Phase**: Speed-ordered combat with player interaction
3. **End Phase**: Victory condition checking and cleanup
4. **Turn Reset**: PP increment and card draw

**Combat System**: 
- Cards sorted by speed determine action order (`turnOrder` array)
- Player cards require click interaction for attack target selection
- Enemy AI uses simple targeting (90% lowest HP, 10% random)
- Attack cancellation via background clicks with event propagation control

### Key Technical Patterns

**Event Handling**: Complex event system for attack targeting:
- `startAttack()` → `updateDisplay()` → enemy card listeners
- `event.stopPropagation()` prevents event conflicts
- `justStartedAttack` flag prevents immediate cancellation

**UI Updates**: Reactive display system:
- `updateDisplay()` regenerates all UI elements each call
- `updateFieldDisplay()` handles card placement and attack mode styling
- `updateTurnOrderDisplay()` shows FF10-style action queue

**AI Behavior**: Simple but effective enemy logic:
- `enemyAISummon()` prioritizes highest cost cards
- `enemyAutoAttack()` targets lowest HP with 90% probability
- Timeout-based sequential AI actions

### Critical Implementation Details

**Card Data Structure**: 10 predefined cards (5 cost-1, 5 cost-2) with five elements:
- Each card has: name, element, hp, attack, speed, cost
- Elements: 木(wood), 火(fire), 土(earth), 金(metal), 水(water)
- Color-coded CSS classes for visual distinction

**Attack System**: Most complex part of codebase:
- `gameState.attackMode` triggers target selection UI
- Enemy cards get `selectable-target` class and click handlers
- Background click detection for attack cancellation
- Event timing managed with `setTimeout` delays

**Memory Management**: Game restart clears all state:
- `gameState` reset to initial values
- DOM elements regenerated from scratch
- Event listeners cleaned up properly

## Development Principles

### Priority Order
1. **Functional gameplay** over visual polish
2. **Simple, working code** over complex features
3. **User interaction clarity** over advanced mechanics

### Code Style
- Japanese comments and variable names for game elements
- Extensive console logging for debugging
- Defensive programming with null checks
- Event-driven architecture with careful listener management

### Phase 2 Vision
- "Attack vs PP Generation" choice system (not yet implemented)
- Enhanced speed-based combat timing
- Five elements interaction system (相剋関係)

## Common Issues

**Attack System Bugs**: Most frequent issues involve:
- Event listener conflicts between player cards and cancel detection
- Timing problems with `justStartedAttack` flag
- Event propagation causing premature attack cancellation

**UI Synchronization**: Display updates must happen after state changes:
- Always call `updateDisplay()` after game state modifications
- `updateTurnOrderDisplay()` for combat phase changes
- `updateMessageDisplay()` for history management

**AI Behavior**: Enemy actions are timeout-based:
- 1000ms delays for player observation
- 1500ms delays between enemy actions
- Sequential processing prevents AI conflicts