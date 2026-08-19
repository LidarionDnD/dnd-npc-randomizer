const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class NPCRandomizerSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    
    static DEFAULT_OPTIONS = {
        id: "dnd-npc-randomizer-settings",
        title: "NPC Randomizer Generate Tables",
        position: {
            width: 400,
            height: "auto"
        },
        window: {
            icon: "fas fa-magic",
            resizable: false
        },
        actions: {
            generateTables: NPCRandomizerSettings.generateTables,
            importNPCs: NPCRandomizerSettings.importNPCs
        }
    };

    static PARTS = {
        form: {
            template: "modules/dnd-npc-randomizer/templates/settings.hbs"
        }
    };

    async _prepareContext(options) {
        return {};
    }

    static async generateTables(event, target) {
        const app = this;
        await NPCRandomizerSettings.generateDefaultTables();
        ui.notifications.info("NPC Randomizer: Default tables checked and generated!");
    }

    static async importNPCs(event, target) {
        const app = this;
        await NPCRandomizerSettings.generateDefaultNPCs();
        ui.notifications.info("NPC Randomizer: Pre-made NPCs imported!");
    }

    static async generateDefaultTables() {
        const folderName = "NPC Name Randomizer";
        
        let folder = game.folders.find(f => f.name === folderName && f.type === "RollTable");
        
        if (!folder) {
            folder = await Folder.create({
                name: folderName,
                type: "RollTable"
            });
            console.log(`dnd-npc-randomizer | Created RollTable Folder: ${folderName}`);
        }

        // List of all default tables shipped in the /data folder
        const defaultTables = [
            "Human - Male", "Human - Female", "Human - Neutral",
            "Dwarf - Male", "Dwarf - Female", "Dwarf - Neutral",
            "Elves - Male", "Elves - Female", "Elves - Neutral"
        ];

        for (const tableName of defaultTables) {
            const exists = game.tables.find(t => t.name === tableName && t.folder?.id === folder.id);
            if (!exists) {
                let results = [];
                
                // Construct the filename from the table name (e.g. "Human - Male" -> "human-male.json")
                const fileName = tableName.toLowerCase().replace(" - ", "-").replace(/ /g, "-") + ".json";
                const filePath = `modules/dnd-npc-randomizer/data/${fileName}`;
                
                try {
                    const response = await fetch(filePath);
                    if (response.ok) {
                        const names = await response.json();
                        if (Array.isArray(names)) {
                            // Create exactly 100 entries if possible, otherwise scale to the array length
                            results = names.map((nameStr, index) => ({
                                type: CONST.TABLE_RESULT_TYPES.TEXT,
                                name: nameStr,
                                weight: 1,
                                range: [index + 1, index + 1]
                            }));
                        }
                    }
                } catch (e) {
                    console.warn(`dnd-npc-randomizer | Could not load names from ${filePath}`, e);
                }

                // fallback to formula 1d100 if empty, else 1d[length]
                const maxRange = results.length > 0 ? results.length : 100;
                
                await RollTable.create({
                    name: tableName,
                    folder: folder.id,
                    formula: `1d${maxRange}`,
                    results: results
                });
                console.log(`dnd-npc-randomizer | Created RollTable: ${tableName}`);
            }
        }
    }

    static async generateDefaultNPCs() {
        const rootFolderName = "Random NPCs";
        let rootFolder = game.folders.find(f => f.name === rootFolderName && f.type === "Actor" && !f.folder);
        
        if (!rootFolder) {
            rootFolder = await Folder.create({
                name: rootFolderName,
                type: "Actor"
            });
            console.log(`dnd-npc-randomizer | Created Root Actor Folder: ${rootFolderName}`);
        }

        const pack = game.packs.get("dnd-npc-randomizer.npc-compendium");
        if (!pack) {
            console.warn("dnd-npc-randomizer | No compendium pack found for NPCs.");
            ui.notifications.warn("Kein NPC Kompendium gefunden!");
            return;
        }

        // 1. Recreate Compendium Folder Structure in the World
        const compendiumFolders = pack.folders.contents;
        const folderMap = new Map(); // Compendium Folder ID -> World Folder ID
        
        const createMappedFolder = async (cFolder) => {
            if (folderMap.has(cFolder.id)) return folderMap.get(cFolder.id);

            let parentId = rootFolder.id;
            const parentCFolderId = cFolder.folder?.id || cFolder.folder;
            
            if (parentCFolderId) {
                const parentCFolder = pack.folders.get(parentCFolderId);
                if (parentCFolder) {
                    parentId = await createMappedFolder(parentCFolder);
                }
            }

            let worldFolder = game.folders.find(f => f.name === cFolder.name && f.type === "Actor" && f.folder?.id === parentId);
            if (!worldFolder) {
                worldFolder = await Folder.create({
                    name: cFolder.name,
                    type: "Actor",
                    folder: parentId,
                    color: cFolder.color,
                    sorting: cFolder.sorting
                });
            }
            folderMap.set(cFolder.id, worldFolder.id);
            return worldFolder.id;
        };

        // Create all folders recursively
        for (const cFolder of compendiumFolders) {
            await createMappedFolder(cFolder);
        }

        // 2. Import Actors into correct mapped folders
        const documents = await pack.getDocuments();
        
        for (const doc of documents) {
            let targetFolderId = rootFolder.id;
            const docFolderId = doc.folder?.id || doc.folder;
            
            if (docFolderId && folderMap.has(docFolderId)) {
                targetFolderId = folderMap.get(docFolderId);
            }

            const exists = game.actors.find(a => a.name === doc.name && a.folder?.id === targetFolderId);
            if (!exists) {
                const actorData = doc.toObject();
                actorData.folder = targetFolderId;
                await Actor.create(actorData);
                console.log(`dnd-npc-randomizer | Imported Actor: ${doc.name}`);
            }
        }
    }
}
