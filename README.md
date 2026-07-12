## 🛠️ UI & User Experience (UX)

- **Optimized Layout:** The side panel (Roster) now extends to the absolute top of the screen (100% height). The Header/Logo has been cleanly integrated into the tactical panel.
- **Standardized Cards (Grid Fix):** Card resizing has been corrected. Cards now have fixed minimum and maximum heights, allowing long weapon and gear names to wrap naturally without breaking or stretching the 4-column grid.
- **Smart Placeholders & Overlays:** Removed the image zoom that caused cropping. Added a dynamic placeholder (a tactical **"?"**) for items without an assigned image. Implemented an **"LV. X"** badge overlay in the corner of card images.
- **Improved Interaction:** Removed the gear icons. The configuration modal now opens by clicking anywhere on the card's image or information area.
- **Auto-Close UX:** The Save button now provides visual feedback with a green **"SAVED ✓"** indicator and smoothly closes the modal after 800ms.
- **Toast Notification System:** Added temporary notification pop-ups in the bottom-right corner to warn users about invalid actions, combined with a shake animation for invalid inputs.
- **Operator Tabs:** Prepared the configuration modal for future expansions with tabs such as **Combat Loadout**, **Artworks**, **Operator Intel**, and **Operator Files**.

## ⚙️ Gameplay & Tactical Systems

- **Gear System:** Added a dedicated Gear tab. The system now supports individual equipment pieces (Armor, Gloves, Kits) and automatically calculates set bonuses (e.g. **MI Security 3-piece**).
- **Level Cap Validation:** Operators can no longer equip gear above their current level. Invalid attempts trigger a toast notification and shake animation while ignoring the item's stats.
- **Dynamic Stat Engine:** Refactored `getCalculatedStats()`. The function now dynamically iterates through any stat key found in `eq.stats`, allowing new stats to be added without writing multiple `if/else` blocks.
- **New Damage Multipliers:** Added native support for `basic_dmg_bonus` and `skill_dmg_bonus` in the global damage calculations.
- **Squad Combat Potential:** Implemented a new panel that estimates the squad's total damage potential (DPS/Burst) based on effective ATK, element/skill multipliers, and Critical Rate/Critical Damage calculations.
- **Anti-Spam Audio System:** Added the `playVoiceLine()` function, which plays native `.mp3` voice lines from the `/sound/` folder when inspecting an operator. Includes an `isAudioPlaying` lock to prevent overlapping playback.

## 🗄️ Database Architecture

- **Template Expansion:** Removed loop-based object generators. All Operators and Weapons are now fully expanded as individual objects inside `script.js`, making manual editing and datamining through VSCode significantly easier.
- **Weapon Database:** Added 36 detailed weapons, including base stats, scaling values, and fully transcribed mathematical talent functions.
- **Image Routing:** Refactored image loading to use dedicated directories: `/images/Operators/`, `/images/Weapons/`, and `/images/Gears/`.
