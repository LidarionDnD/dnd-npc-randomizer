# DnD NPC Randomizer

A Foundry VTT module (compatible with v14+) for the automatic and random generation of NPC names and the dynamic assignment of portraits for the D&D 5e system. Ideal for Game Masters who want to quickly drag and drop individual NPCs onto the map with fitting names and portraits.

## Features

* **Random Names via RollTables**: Assign a RollTable to an NPC's prototype token. As soon as the NPC is dragged onto the scene (as an "unlinked" token), a name is automatically rolled from the table and assigned.
* **Automatic Portrait**: When a token is dragged onto the map, the module searches for a corresponding portrait image. For example, if your token image is located at `Images/Goblins/Goblin_01.png`, the module checks if an image exists at `Images/Goblins/Portraits/Goblin_01_Portrait.png` and automatically sets this as the character portrait in the actor sheet, without changing the token image on the map.
* **Dynamic Token Settings**: In the Token settings (under the "Identity" tab), the module adds a dropdown menu where you can directly select the desired name table for this NPC.
* **Smart Linking**: The module is explicitly designed for unlinked tokens. As soon as "Link Actor Data" is activated in the token settings, the name assignment is automatically disabled.
* **Included Default Content**: Default name tables (Human, Dwarf, Elf, etc.) can be generated via the module settings, and a compendium of pre-made NPCs can be imported directly into the game world.

## Installation

### Recommended
1. Open Foundry VTT and go to the **Add-on Modules** tab.
2. Click **Install Module** and search for **DnD NPC Randomizer**.
3. Click Install.
4. Launch your world and enable the module in the "Manage Modules" menu.

### Manual Installation (Alternative)
1. Create a new folder named exactly `dnd-npc-randomizer` inside your Foundry VTT `Data/modules/` directory.
2. Extract/copy all the downloaded contents from GitHub directly into this newly created folder.
3. Restart Foundry VTT.
4. Enable the module in the "Manage Modules" menu of your world.

## Usage

### 1. Preparing Name Tables
As soon as the module is activated for the first time (or manually via the module settings), it automatically generates the **"NPC Name Randomizer"** folder in the RollTable tab and populates it with default tables for various ancestries.
* **Expanding**: You can create your own tables in this folder at any time. The module automatically detects all tables located in this folder and offers them for selection in the token's dropdown menu.

### 2. Configuring Tokens
1. Open the character sheet of any actor and go to the **Prototype Token** settings.
2. Ensure that **Link Actor Data** is *not* activated.
3. Under the **Identity** tab, you will find the new dropdown menu for the **NPC Name Randomizer**.
4. Select one of the tables (e.g., "Human - Male") and click Save.

### 3. Dragging to the Scene
Drag the configured actor from the sidebar onto the scene.
* The newly created token on the map (and its actor data) will immediately be assigned a random name from the RollTable.
* At the same time, the module will search for a corresponding portrait for this token (as described under Features) and assign it as the image in the character sheet.
* The Game Master receives a short UI notification about the newly assigned name.

### 4. Module Settings & Compendium
In the game settings, under the **Module Settings** tab, you will find two specific sections for the *DnD NPC Randomizer*:
* **Generate Default Tables**: Contains the "Import RollTables" button, which checks the table folder and restores any accidentally deleted default tables.
* **Generate Default NPCs**: Contains the "Import NPCs" button, which imports the included pre-made NPCs from the module's compendium, along with their pre-configured folder structure, into your active world.

## Notes

* This module is specifically designed for the **D&D 5e** system (although the main features could potentially work in other systems, provided they use the same standard token structures).
* **Portrait Folder Structure**: For the automatic portrait feature to work, you must structure your image files properly. Example: A token image located at `Images/Goblins/Goblin_01.png` requires a portrait image located at `Images/Goblins/Portraits/Goblin_01_Portrait.png`.
