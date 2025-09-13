import {Item} from "war3-objectdata-th";
import {ItemGroup} from "./item-groups";

const ITEMS_BY_ID: Record<string, Item> = compiletime(({objectData}) => {
    return objectData.items.game
}) as Record<string, Item>;

const ITEM_GROUPS_BY_ID = compiletime(({objectData}) => {
    const {itemGroup2FourCC, ItemClass, VALID_LEVELS, ItemGroup} = require("../../../src/loot-indicator/modules/item-groups.ts");
    const {groupBy} = require("../../../src/loot-indicator/modules/util.ts");

    const itemsByGroup = groupBy(Object.keys(objectData.items.game),
        (itemId: string) => {
            const item = objectData.items.get(itemId)!;
            const groupId = itemGroup2FourCC(item.classification, item.level);
            if (groupId === undefined) {
                throw new Error(`Failed to create 4cc group id from item "${itemId}": 
                class: ${item.classification}, level: ${item.level}`);
            }
            return groupId;
        }
    );

    const itemGroups = new Map<string, ItemGroup>();
    for (const iClass of Object.values(ItemClass)) {
        for (const iLevel of Array.from(VALID_LEVELS.values())) {
            const groupId = itemGroup2FourCC(iClass, iLevel)!;
            const items = itemsByGroup.get(groupId);
            itemGroups.set(groupId, new ItemGroup(groupId, iClass, iLevel, items ?? []));
        }
    }

    const assert = require('assert');
    assert(itemGroups.size === (9 * 7), `Expected ${9 * 7} groups, but got ${itemGroups.size}`)
    const numItems = Array.from(itemGroups.values()).flatMap(v => v.items).length;
    assert(numItems === 283, `Expected 283 items, but got ${numItems}`)

    return Object.fromEntries(itemGroups);
}) as Record<string, ItemGroup>;

export function getItemById(fourCCid: string): Item | undefined {
    return ITEMS_BY_ID[fourCCid];
}

//Group such as "YiI1" - which includes items of class "Permanent", level 1.
export function getItemGroupById(fourCCid: string): ItemGroup | undefined {
    return ITEM_GROUPS_BY_ID[fourCCid];
}

export function getItemIdsByGroupId(fourCCid: string): string[] | undefined {
    return getItemGroupById(fourCCid)?.items;
}

export function getItemsByGroupId(fourCCid: string): Item[] | undefined {
    return getItemIdsByGroupId(fourCCid)?.map(itemId => getItemById(itemId)!);
}