# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

五行カードバトル (Five Elements Card Battle) is a strategic card game built with vanilla JavaScript, implementing the Five Elements philosophy from traditional Chinese thought. The game features a 3v3 card battle system with phase-based gameplay and element-based combat effectiveness.

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript with TypeScript type annotations (JSDoc)
- **UI Frameworks**: 
  - Tailwind CSS 3.4.1 (CDN) - Modern utility-first styling
  - Alpine.js 3.14.1 (CDN) - Reactive UI components
- **Development**: TypeScript support via JSDoc + tsconfig.json (no build process)
- **Audio**: HTML5 Audio API with comprehensive sound management
- **Deployment**: GitHub Pages compatible (no build step required)

## Core Architecture

### Game State Management
The game uses a centralized state pattern with TypeScript annotations:

```javascript
/** @type {GameState} */
let gameState = {
    playerField: [],    // Cards on player battlefield
    enemyField: [],     // Cards on enemy battlefield  
    playerHand: [],     // Cards in player hand
    enemyHand: [],      // Cards in enemy hand
    playerPP: 1,        // Player Power Points
    enemyPP: 1,         // Enemy Power Points
    turn: 1,            // Current turn number
    phase: 'summon',    // 'summon' or 'battle'
    defeatedCost: 0,    // Total cost of defeated enemy cards
    messageHistory: []  // Game event messages
};
```

### Key Systems

1. **Card System**: Five elements (木火土金水) with combat effectiveness relationships
2. **Phase System**: Alternates between summon phase (card placement) and battle phase (combat)
3. **PP System**: Power Points increase each turn, used for summoning cards
4. **Speed-based Combat**: Cards act in order of speed value (similar to Final Fantasy X)
5. **Element Effectiveness**: Implements traditional Five Elements relationships for damage bonuses

### File Structure

- `index.html` - Main game interface with 16:9 responsive viewport
- `script.js` - Core game logic with TypeScript annotations  
- `style.css` - Base styles (being migrated to Tailwind CSS)
- `types.ts` - TypeScript type definitions
- `assets/` - Game assets (images, audio files)

## Development Commands

### Running the Game
- Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
- No build process required - runs directly in browser
- Use browser dev tools for debugging (extensive console logging included)

### TypeScript Checking
```bash
# Install TypeScript globally if not already installed
npm install -g typescript

# Check types without compilation
tsc --noEmit

# Watch mode for continuous type checking
tsc --noEmit --watch
```

### Development Server (Optional)
```bash
# Simple HTTP server to avoid CORS issues with audio files
python -m http.server 8000
# or
npx serve .
```

## Code Patterns and Conventions

### TypeScript Integration
- Uses JSDoc comments for type annotations
- No compilation step - types are checked by IDE/tsc
- Core types defined in both JSDoc and types.ts

### Event-Driven Architecture
- DOM event handlers manage user interactions
- Custom game events for phase transitions
- Sound system integrated with all user actions

### Debugging Support
- Extensive Japanese console logging with emojis for readability
- Detailed state tracking for game progression
- Error handling with stack traces

### UI State Management
- Alpine.js for reactive components (audio panel)
- Manual DOM manipulation for game state updates
- Tailwind CSS classes for responsive design

## Game Logic Implementation

### Combat System
- Five Elements effectiveness: 木→土, 火→金, 土→水, 金→木, 水→火
- Damage bonuses: Cost 1 cards get +3, Cost 2 cards get +5
- Speed-based turn order with manual target selection

### Victory Conditions
- Primary: Defeat enemy cards totaling 5 cost points
- Secondary: Eliminate all enemy field cards
- Draw: Both fields eliminated simultaneously

### AI Behavior
- Simple but effective enemy AI for card placement and targeting
- Considers element effectiveness in decision making

## Development Guidelines

### Code Style
- Japanese comments for game logic explanations
- Emoji-enhanced console logging for debugging clarity
- Consistent naming: camelCase for variables, kebab-case for CSS classes

### State Management
- Always update gameState object before DOM updates
- Use type annotations for complex objects and functions
- Validate state changes in development mode

### Audio Integration
- All user interactions should trigger appropriate sound effects
- BGM management through SoundManager singleton
- Graceful fallback when audio files unavailable

### Responsive Design
- 16:9 aspect ratio game viewport for consistent experience
- Tailwind CSS utilities for responsive behavior
- Mobile-friendly touch interactions

## Testing and Debugging

### Browser Console
- Enable browser dev tools to see detailed game state logging
- Game state is exposed globally for inspection
- Error messages include stack traces and context

### Common Debug Patterns
```javascript
// State inspection
console.log('🎮 ゲーム状態:', gameState);

// Event tracking  
console.log('🎯 イベント実行:', eventName, eventData);

// Error context
console.error('❌ エラー発生:', error.message, error.stack);
```

### Audio Debugging
- Check browser console for audio loading status
- Verify file paths in assets/audio/ directory
- Test audio permissions in browser settings

## Performance Considerations

- No build optimization required - modern browsers handle vanilla JS efficiently
- Audio files are preloaded to prevent delays during gameplay
- DOM updates are batched where possible to minimize reflows
- CSS animations use hardware acceleration (transform, opacity)

## Future Development Notes

The project is designed for educational purposes and AI-assisted development. The codebase includes extensive logging and documentation to facilitate understanding and modification. The modular architecture allows for easy extension of game mechanics while maintaining code clarity.