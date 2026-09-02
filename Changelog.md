# Changelog

## [2.0.0] - 2026-09-02

### New Name Tables
* **Added Tieflings**: Two new name lists with 200 entries each:
  * `Tiefling - Male` (`data/tiefling-male.json`)
  * `Tiefling - Female` (`data/tiefling-female.json`)
* Both tables are integrated into the automatic table generation (`defaultTables`) in module settings.

### Compendium Expansion & Reorganization (`Lidarion - Random NPCs`)
* **New Label**: Compendium pack renamed to `Lidarion - Random NPCs` (internal pack ID remains `npc-compendium` for full backwards compatibility).
* **Two-Tier Folder Hierarchy (Tier 1 & Tier 2)**: 5 clean top-level categories instead of a flat list:
  * `Townsfolk` (Alchemist, Bard, Blacksmith, Commoner, Innkeeper, Merchant, Noble)
  * `Guards & Warriors` (Guard, Knight, Ranger, Rogue)
  * `Spellcasters & Faith` (Mage, Priest)
  * `Cultists` (20 thematic subfolders)
  * `Templates` (Samplecharactersheet)
* **400 New Pre-Made NPCs Added**:
  * **80 Standard NPCs**: 10 roles $\times$ 8 race/gender combinations with matching stats (`Commoner`, `Knight`, `Mage`, `Priest`, `Scout`, `Spy`).
  * **320 Cultists**: 20 variations $\times$ 8 combinations $\times$ 2 versions (`Cultist - <Type> (<Race>-<M|F>)` and `Cultist Fanatic - <Type> (<Race>-<M|F>)`).
* **Prototype Token Configuration**:
  * Scale set to `1.2`, Dynamic Ring enabled, Disposition set to *Neutral*.
  * Vision: `120 ft` Range with D&D 5e `darkvision` for Dwarves, Elves, and Tieflings (`basic` for Humans).
  * Bar 2 assigned to `Armor Class` (`attributes.ac.value`).
  * Wildcard token images and matching RollTables linked for automatic name generation.

### New Feature: "Copy to Actor Sidebar"
* **Header Controls Entry**: Added **"Copy to Actor Sidebar"** to the Actor Sheet window header controls menu (alongside *Detach Window*, *Configure Sheet*, etc.).
* **Automatic Token Linking**:
  * Creates a new world actor in the Actor Sidebar with **"Link Actor Data"** (`actorLink: true`) enabled.
  * Links the placed scene token directly to the new sidebar actor (both share the exact same UUID).
* **Duplicate Name Handling**: If an actor with the same name already exists in the sidebar, standard duplicate handling appends `(Copy)`.
* **Auto-Close**: Automatically closes the open character sheet upon copying.

## [1.1.0]

### Added
- Included new pre-made NPCs in the default compendium pack: Knights and Guards.

### Changed
- **Portrait Image Matching:** Simplified the automated portrait assignment logic. The module now expects parallel directories named `Tokens` and `Portraits` instead of a relative `Portraits` subdirectory and a `_Portrait` file suffix.
  - Example: A token at `.../Tokens/Goblin_01.webp` will now automatically map to `.../Portraits/Goblin_01.webp`.
  - The filename now remains identical between token and portrait, which simplifies bulk image management and avoids the need for batch renaming scripts.
- Removed obsolete string manipulation logic for finding subdirectories and suffixes, resulting in faster and more resilient execution when generating NPCs.
