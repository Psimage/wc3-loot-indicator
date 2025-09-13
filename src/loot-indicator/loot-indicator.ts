import {Effect, MapPlayer, Trigger, Unit, File, Color, Timer} from "w3ts";
import {findMapInitialCreepsWithDrops, ItemDrop, ItemDropSet, RandomItemGroupDrop, UnitItemDrop} from "./modules/unit-item-drops";
import {ItemClass} from "./modules/item-groups";
import {getItemById} from "./modules/items-db";
import {METAKEY_CTRL, METAKEY_NONE} from "./modules/util";

//For local player. Veriest per player.
let IS_INDICATOR_ENABLED_LOCAL = false;
let IS_CTRL_BTN_HELD_LOCAL = false;

let ACTIVE_INDICATORS = new Map<unit, UnitLootIndicator>();

export function handleCreepLootIndicator() {
    IS_INDICATOR_ENABLED_LOCAL = loadFeatureState();

    const unitsWithDrops = findMapInitialCreepsWithDrops();
    createIndicators(unitsWithDrops);

    enableFeatureToggleChatCommand()
    enableTrackCtrlBtnHeld();
}

function loadFeatureState(): boolean {
    return File.read("w3cCreepLootIndicator.txt") === "on";
}

function saveFeatureState(isEnabled: boolean) {
    File.write("w3cCreepLootIndicator.txt", isEnabled ? "on" : "off");
}

function createIndicators(unitsWithDrops: UnitItemDrop[]) {
    for (const unitWithDrop of unitsWithDrops) {
        const indicator = UnitLootIndicator.create(unitWithDrop);
        IS_INDICATOR_ENABLED_LOCAL ? indicator.show() : indicator.hide();

        ACTIVE_INDICATORS.set(indicator.unit.handle, indicator);

        registerUnitItemDroppedEvent(indicator.unit, () => {
            indicator.destroy();
            ACTIVE_INDICATORS.delete(indicator.unit.handle);
        });
    }
}

function registerUnitItemDroppedEvent(unit: Unit, action: () => void) {
    const t = Trigger.create();
    t.registerUnitEvent(unit, EVENT_UNIT_DEATH)
    t.registerUnitEvent(unit, EVENT_UNIT_CHANGE_OWNER)
    t.addAction(() => {
        action();
        t.destroy();
    });
}

function enableFeatureToggleChatCommand() {
    const t = Trigger.create();
    for (let i = 0; i < bj_MAX_PLAYERS; i++) {
        t.registerPlayerChatEvent(MapPlayer.fromIndex(i)!, "-loot", true);
    }
    t.addAction(() => {
        const player = MapPlayer.fromEvent()!;
        if(player.isLocal()) {
            IS_INDICATOR_ENABLED_LOCAL = !IS_INDICATOR_ENABLED_LOCAL;
            saveFeatureState(IS_INDICATOR_ENABLED_LOCAL);

            ACTIVE_INDICATORS.forEach(indicator => {
                IS_INDICATOR_ENABLED_LOCAL ? indicator.show() : indicator.hide()
            });
            DisplayTextToPlayer(player.handle, 0, 0, `\n|cff00ff00[W3C]:|r Creeps loot indicator is now |cffffff00 ` + (IS_INDICATOR_ENABLED_LOCAL ? `ENABLED` : `DISABLED`) + `|r.`)
        }
    })
}

function enableTrackCtrlBtnHeld() {
    const tDown = Trigger.create();
    const tUp = Trigger.create();
    for (let i = 0; i < bj_MAX_PLAYERS; i++) {
        tDown.registerPlayerKeyEvent(MapPlayer.fromIndex(i)!, OSKEY_LCONTROL, METAKEY_CTRL, true);
        tUp.registerPlayerKeyEvent(MapPlayer.fromIndex(i)!, OSKEY_LCONTROL, METAKEY_NONE, false);
    }

    tDown.addAction(() => {
        if(MapPlayer.fromEvent()!.isLocal()) {
            //By default, the action is called multiple times while the button is held down
            if (!IS_CTRL_BTN_HELD_LOCAL) {
                IS_CTRL_BTN_HELD_LOCAL = true;
            }
        }
    })
    tUp.addAction(() => {
        if(MapPlayer.fromEvent()!.isLocal()) {
            IS_CTRL_BTN_HELD_LOCAL = false;
        }
    })
}

function getSingleGroupDrop(itemDropSets: ItemDropSet[]): RandomItemGroupDrop | undefined {
    if (itemDropSets.length === 1 && itemDropSets[0].itemDrops.length === 1
        && itemDropSets[0].itemDrops[0] instanceof RandomItemGroupDrop) {
        return itemDropSets[0].itemDrops[0];
    }
}

function isTomeDrop(itemDrop: ItemDrop): boolean {
    if (itemDrop instanceof RandomItemGroupDrop) {
        const group = itemDrop.itemGroup;
        return group.itemClass === ItemClass.Power_Up &&
            (group.itemLevel === 1 || group.itemLevel === 2)
    }

    return false;
}

/*
    //Short form (1 dropset, 1 group item)

    Dark Troll
    == [Permanent, LVL 1] ==
    Slipper of Agility + 15
    Ring of Health

    //Long form

    Dark Troll
    == Drop 1 ==
    Slipper of Agility + 15
    Ring of Health
    == Drop 2 ==
    Sentry Ward
    Ring of Health
 */
function buildDropsInfoMsg(unit: Unit, drops: ItemDropSet[]): string {
    let msg = `\n|cffffff00${unit.name}|r\n`
    const hasManyItems = drops.flatMap(s => s.itemDrops.flatMap(d => d.getDropItemIds())).length > 10;
    const itemsSeparator = hasManyItems ? ", " : "\n";

    const groupDrop = getSingleGroupDrop(drops);
    if (groupDrop != undefined) {
        msg += `== |cff00ff00[${groupDrop.itemGroup.itemClass}, LVL ${groupDrop.itemGroup.itemLevel}]|r ==\n`;
        msg += groupDrop.getDropItemIds().map(id => `${getItemById(id)!.name}`).join(itemsSeparator)
    } else {
        msg += drops.map((dropSet, i) => {
            let m = `== |cff00ff00Drop ${i + 1}|r ==\n`;
            m += dropSet.itemDrops.flatMap(d => d.getDropItemIds())
                .map(id => `${getItemById(id)!.name}`)
                .join(itemsSeparator)
            return m;
        }).join("\n");
    }

    // You can break msg box with too big messages that contain newlines
    if (msg.length > 600) {
        msg = msg.substring(0, 600) + "...";
    }

    return msg;
}

class UnitLootIndicator {
    readonly unit: Unit;
    readonly itemDropSets: ItemDropSet[];

    private readonly indicatorEffect: Effect;
    private indicatorScale: number;
    private isVisible: boolean;
    private printLootTrigger?: Trigger;
    private lootInfoMsg: string;

    constructor(unit: Unit, itemDropSets: ItemDropSet[], indicatorEffect: Effect) {
        this.unit = unit;
        this.itemDropSets = itemDropSets;
        this.indicatorEffect = indicatorEffect;
        this.indicatorScale = indicatorEffect.scale;
        this.isVisible = true;
        this.lootInfoMsg = buildDropsInfoMsg(unit, itemDropSets);
    }

    static create(unitItemDrop: UnitItemDrop): UnitLootIndicator {
        const unit = unitItemDrop.unit;
        const itemDropSets = unitItemDrop.dropSets;
        let e: Effect;

        //In 99% of cases a unit has a single set (drops 1 item) with a single group item drop (can drop any item from that group)
        const groupDrop = getSingleGroupDrop(itemDropSets);
        if (groupDrop && isTomeDrop(groupDrop)) {
            //TODO: Attached "overhead" effect interferes with "Sleep(Zzzz)" effect. (e.g. setting My effect scale also sets Sleep effect scale)
            //TODO: Effect disappears when unit is Hexed (and probably any other skin/model change spell). But the handle is not destroyed!
            //TODO: Effect inherits unit's tint color which can't be changed?
            e = Effect.createAttachment("Objects\\InventoryItems\\tomeRed\\tomeRed.mdl", unit, "overhead")!;
            // Effect inherits unit scale so we "unscale" it. This results in the same size effect on all units
            //TODO: Scale is shared with other attached effects (e.g. Sleep (Zzzz)!)
            e.scale = e.scale / (unit.getField(UNIT_RF_SCALING_VALUE) as number) * 0.6;
        } else {
            e = Effect.createAttachment("Objects\\InventoryItems\\PotofGold\\PotofGold.mdx", unit, "overhead")!;
            e.scale = e.scale / (unit.getField(UNIT_RF_SCALING_VALUE) as number) * 0.95;
        }

        const indicator = new UnitLootIndicator(unit, itemDropSets, e);
        indicator.enablePrintLootOnSelection();
        return indicator;
    }

    hide() {
        if (!this.isVisible) return;
        this.isVisible = false;

        //TODO: just use scale=0 with custom, detached effect
        //Scale does not prevent particles from being visible, and is shared with other attached effects
        //Animation timescale also does not work
        //So instead we skip to the end (100 seconds?) of non-looping animation
        this.indicatorEffect.playAnimation(ANIM_TYPE_DEATH)
        this.indicatorEffect.setTime(100.0)
    }

    show() {
        if (this.isVisible) return;
        this.isVisible = true;

        this.indicatorEffect.playAnimation(ANIM_TYPE_STAND)
        this.indicatorEffect.setTime(0.0)
    }

    destroy() {
        this.indicatorEffect.destroy();
        this.printLootTrigger?.destroy();
    }

    private enablePrintLootOnSelection() {
        this.printLootTrigger = Trigger.create();
        this.printLootTrigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_SELECTED);
        this.printLootTrigger.addCondition(() => Unit.fromEvent()?.handle === this.unit.handle);
        this.printLootTrigger.addAction(() => {
            const player = MapPlayer.fromEvent()!;
            if (player.isLocal() && IS_CTRL_BTN_HELD_LOCAL) {
                DisplayTimedTextToPlayer(player.handle, 0, 0, 5, this.lootInfoMsg);
            }
        });
    }
}