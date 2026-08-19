import { NPCRandomizerSettings } from "./settings.js";

Hooks.once("init", () => {
    console.log("dnd-npc-randomizer | Initializing module");

    game.settings.registerMenu("dnd-npc-randomizer", "npcRandomizerMenu", {
        name: "Generate Default Tables",
        label: "Open Generator",
        hint: "Manually generate missing default tables into your configured RollTable folder.",
        icon: "fas fa-magic",
        type: NPCRandomizerSettings,
        restricted: true
    });

    game.settings.register("dnd-npc-randomizer", "initialized", {
        name: "Initialized",
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });
});

Hooks.once("ready", async () => {
    // Erstelle die Standard-Tabellen und importiere NPCs nur einmalig bei der ersten Aktivierung/Initialisierung
    if (game.user.isGM) {
        const isInitialized = game.settings.get("dnd-npc-randomizer", "initialized");
        if (!isInitialized) {
            await NPCRandomizerSettings.generateDefaultTables();
            await NPCRandomizerSettings.generateDefaultNPCs();
            await game.settings.set("dnd-npc-randomizer", "initialized", true);
        }
    }
});

const injectTokenConfig = async (app, html, data) => {
    // 3. Die Einstellung soll NICHT bei bereits platzierten Tokens (auf der Szene) angezeigt werden
    if (!app.isPrototype) return;

    let element = html;
    if (typeof jQuery !== "undefined" && element instanceof jQuery) {
        element = element[0];
    } else if (!element && app.element) {
        element = (typeof jQuery !== "undefined" && app.element instanceof jQuery) ? app.element[0] : app.element;
    }
    
    if (!element) return;

    setTimeout(async () => {
        const form = element.querySelector('form') || element;
        
        // Prevent double injection
        if (form.querySelector('.dnd-npc-randomizer-group')) return;

        // Is this a token config? Look for characteristic fields
        let linkActorInput = form.querySelector('[name="actorLink"], [name="document.actorLink"], [name="client.actorLink"], [name="flags.actorLink"]');
        let displayNameInput = form.querySelector('[name="name"], [name="displayName"], [name="document.name"], [name="document.displayName"]');
        let identityTab = form.querySelector('.tab[data-tab="character"], .tab[data-tab="identity"], section[data-tab="identity"], fieldset.identity');

        if (!linkActorInput && !displayNameInput && !identityTab) {
            return; 
        }

        let linkActorGroup = null;
        if (linkActorInput) {
            linkActorGroup = linkActorInput.closest('.form-group, form-group, fieldset');
        }
        if (!linkActorGroup && displayNameInput) {
            linkActorGroup = displayNameInput.closest('.form-group, form-group, fieldset');
        }
        if (!linkActorGroup && identityTab) {
            linkActorGroup = identityTab;
        }
        if (!linkActorGroup) {
            linkActorGroup = form;
        }

        // Retrieve RollTables in the configured target folder
        const folderName = "NPC Name Randomizer";
        const folder = game.folders.find(f => f.name === folderName && f.type === "RollTable");
        let tables = folder ? game.tables.filter(t => t.folder?.id === folder.id) : [];
        
        // Ensure alphabetical sorting of the tables
        tables.sort((a, b) => a.name.localeCompare(b.name));
        
        let currentTableId = "";
        
        // Try getting the flag from various possible locations (Token Document, Actor PrototypeToken)
        if (app.token && typeof app.token.getFlag === "function") {
            currentTableId = app.token.getFlag("dnd-npc-randomizer", "nameRollTable");
        }
        if (!currentTableId && app.document && typeof app.document.getFlag === "function") {
            currentTableId = app.document.getFlag("dnd-npc-randomizer", "nameRollTable");
        }
        if (!currentTableId && app.actor) {
            currentTableId = foundry.utils.getProperty(app.actor, "prototypeToken.flags.dnd-npc-randomizer.nameRollTable");
        }
        if (!currentTableId && app.object) { // For older V11 fallbacks
            if (app.object.prototypeToken) {
                currentTableId = foundry.utils.getProperty(app.object, "prototypeToken.flags.dnd-npc-randomizer.nameRollTable");
            } else if (typeof app.object.getFlag === "function") {
                currentTableId = app.object.getFlag("dnd-npc-randomizer", "nameRollTable");
            }
        }
        
        currentTableId = currentTableId || "";
        
        const templateData = {
            tables: tables.map(t => ({
                id: t.id,
                name: t.name,
                selected: t.id === currentTableId
            }))
        };

        const templateContent = await renderTemplate("modules/dnd-npc-randomizer/templates/token-config.hbs", templateData);
        
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = templateContent;
        const injectedGroup = tempDiv.firstElementChild;
        
        if (linkActorGroup && linkActorGroup.parentNode && linkActorGroup !== form && linkActorGroup !== identityTab) {
            linkActorGroup.parentNode.insertBefore(injectedGroup, linkActorGroup);
        } else if (linkActorGroup) {
            linkActorGroup.appendChild(injectedGroup);
        }

        // 2. Disable logic: When "Link Actor Data" is checked, set Name Randomizer to "-- None --"
        const select = injectedGroup.querySelector('select');
        
        // Track the pending value on the app instance so we can inject it on save
        select.addEventListener("change", (event) => {
            app._dndPendingRollTable = event.target.value;
        });

        if (linkActorInput && select) {
            const toggleDisabled = () => {
                const isLinked = linkActorInput.checked === undefined ? linkActorInput.hasAttribute('checked') : linkActorInput.checked;
                select.disabled = isLinked;
                if (isLinked) {
                    select.value = ""; // Jump to "-- None --"
                    app._dndPendingRollTable = "";
                }
            };
            linkActorInput.addEventListener("change", toggleDisabled);
            setTimeout(toggleDisabled, 10); // Ensure initial state is applied
        }
    }, 150);
};

Hooks.on("renderApplication", injectTokenConfig);
Hooks.on("renderDocumentSheet", injectTokenConfig);
Hooks.on("renderTokenConfig", injectTokenConfig);
Hooks.on("renderPrototypeTokenConfig", injectTokenConfig);

// Inject the flag into the database update when the user clicks Save
Hooks.on("preUpdateActor", (actor, changes, options, userId) => {
    if (actor.apps) {
        for (const app of Object.values(actor.apps)) {
            if (app._dndPendingRollTable !== undefined) {
                foundry.utils.setProperty(changes, "prototypeToken.flags.dnd-npc-randomizer.nameRollTable", app._dndPendingRollTable);
                delete app._dndPendingRollTable;
            }
        }
    }
});

Hooks.on("preUpdateToken", (token, changes, options, userId) => {
    if (token.apps) {
        for (const app of Object.values(token.apps)) {
            if (app._dndPendingRollTable !== undefined) {
                foundry.utils.setProperty(changes, "flags.dnd-npc-randomizer.nameRollTable", app._dndPendingRollTable);
                delete app._dndPendingRollTable;
            }
        }
    }
});

Hooks.on("createToken", async (token, options, userId) => {
    // Only the user executing the creation should process the generation logic
    if (game.user.id !== userId) return;

    // Feature is restricted to unlinked actors
    if (token.actorLink) return;

    // 1. Fetch tableId from the token's flags (copied from prototype)
    let tableId = token.getFlag("dnd-npc-randomizer", "nameRollTable");
    
    // 2. Aggressive Fallback: If not found on token, read directly from the Actor!
    if (!tableId && token.actor) {
        tableId = foundry.utils.getProperty(token.actor, "prototypeToken.flags.dnd-npc-randomizer.nameRollTable");
    }

    let newImg = undefined;
    let newName = undefined;

    // Feature A: Portrait Image Matching (Suffix _Portrait in a relative "Portraits" folder)
    const currentImg = token.texture?.src || token._source?.texture?.src;
    if (currentImg) {
        const lastSlashIndex = currentImg.lastIndexOf("/");
        const lastDotIndex = currentImg.lastIndexOf(".");
        
        if (lastSlashIndex >= 0 && lastDotIndex > lastSlashIndex) {
            const folderPath = currentImg.substring(0, lastSlashIndex);
            const fileName = currentImg.substring(lastSlashIndex + 1, lastDotIndex);
            const ext = currentImg.substring(lastDotIndex);
            
            // Expected portrait path: [folder]/Portraits/[filename]_Portrait[ext]
            const expectedPortraitPath = `${folderPath}/Portraits/${fileName}_Portrait${ext}`;
            
            try {
                // Perform a fast HEAD request to check if the file actually exists
                const response = await fetch(expectedPortraitPath, { method: "HEAD" });
                if (response.ok) {
                    newImg = expectedPortraitPath;
                }
            } catch (error) {
                console.warn("dnd-npc-randomizer | Could not verify portrait image:", error);
            }
        }
    }

    // Feature B: Random Name assignment
    if (tableId) {
        const table = game.tables.get(tableId);
        
        // Ensure the table actually belongs to the currently configured folder
        // so we don't accidentally use old ghost references if the folder was changed.
        const configuredFolder = "NPC Name Randomizer";
        if (table && table.folder?.name === configuredFolder) {
            try {
                // Await the table roll.
                const rollData = await table.roll({ async: true });
                if (rollData && rollData.results && rollData.results.length > 0) {
                    // Handle different TableResult structures across Foundry versions (V12, V13, V14)
                    const res = rollData.results[0];
                    newName = res.name || res.text || (typeof res.get === "function" ? res.get("text") : undefined);
                }
            } catch (e) {
                console.error("dnd-npc-randomizer | Table roll error:", e);
            }
        }
    }

    // Abort if nothing to update
    if (!newName && !newImg) return;

    // Prepare a single comprehensive database update
    const updates = {};
    
    if (newName) {
        updates.name = newName;         // Map Label
        updates["delta.name"] = newName; // Character Sheet Name
    }

    if (newImg) {
        updates["delta.img"] = newImg;   // Character Sheet Portrait
        // Explicitly force the token image to remain its current image to prevent 
        // the game system (e.g. D&D 5e) from auto-syncing the map token to the new portrait!
        updates["texture.src"] = currentImg;
    }

    if (Object.keys(updates).length > 0) {
        await token.update(updates);
        
        // Visual feedback
        if (newName) {
            ui.notifications.info(`NPC Randomizer: Token renamed to "${newName}"`);
        }
    }
});
