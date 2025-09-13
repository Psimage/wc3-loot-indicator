import {getMapItemDrops} from "./map-loot-parser";
import {Items} from "@objectdata/items";
import type {RawItemDropSet, Point2D, RawUnitItemDrop} from "../../../src/loot-indicator/modules/unit-item-drops";

const GRID_SIZE = 128;
const GRID_START = {x: -860, y: 1630};

const actualDropData = getMapItemDrops('./maps/itemdroptable-testbench.w3x');
//sort from Top to Bottom, Left to Right at grid size
actualDropData.sort((a, b) => {
    const rowA = Math.floor((a.unitLocation.y - GRID_START.y) / GRID_SIZE);
    const rowB = Math.floor((b.unitLocation.y - GRID_START.y) / GRID_SIZE);
    if (rowA !== rowB) return rowB - rowA;
    const colA = Math.floor((a.unitLocation.x - GRID_START.x) / GRID_SIZE);
    const colB = Math.floor((b.unitLocation.x - GRID_START.x) / GRID_SIZE);
    return colA - colB;
});

const expectedDropData: RawUnitItemDrop[] = [
    //misc
    createDrop(atCell(0, 0), [['YoI0']]),
    createDrop(atCell(1, 0), [['YoI1']]),
    createDrop(atCell(2, 0), [['YoI2']]),
    createDrop(atCell(3, 0), [['YoI3']]),
    createDrop(atCell(4, 0), [['YoI4']]),
    createDrop(atCell(5, 0), [['YoI5']]),
    createDrop(atCell(6, 0), [['YoI6']]),
    createDrop(atCell(7, 0), [['YoI7']]),
    createDrop(atCell(8, 0), [['YoI8']]),

    //perm
    createDrop(atCell(0, 2), [['YiI0']]),
    createDrop(atCell(1, 2), [['YiI1']]),
    createDrop(atCell(2, 2), [['YiI2']]),
    createDrop(atCell(3, 2), [['YiI3']]),
    createDrop(atCell(4, 2), [['YiI4']]),
    createDrop(atCell(5, 2), [['YiI5']]),
    createDrop(atCell(6, 2), [['YiI6']]),
    createDrop(atCell(7, 2), [['YiI7']]),
    createDrop(atCell(8, 2), [['YiI8']]),

    //charged
    createDrop(atCell(0, 4), [['YjI0']]),
    createDrop(atCell(1, 4), [['YjI1']]),
    createDrop(atCell(2, 4), [['YjI2']]),
    createDrop(atCell(3, 4), [['YjI3']]),
    createDrop(atCell(4, 4), [['YjI4']]),
    createDrop(atCell(5, 4), [['YjI5']]),
    createDrop(atCell(6, 4), [['YjI6']]),
    createDrop(atCell(7, 4), [['YjI7']]),
    createDrop(atCell(8, 4), [['YjI8']]),

    //power up
    createDrop(atCell(0, 6), [['YkI0']]),
    createDrop(atCell(1, 6), [['YkI1']]),
    createDrop(atCell(2, 6), [['YkI2']]),
    createDrop(atCell(3, 6), [['YkI3']]),
    createDrop(atCell(4, 6), [['YkI4']]),
    createDrop(atCell(5, 6), [['YkI5']]),
    createDrop(atCell(6, 6), [['YkI6']]),
    createDrop(atCell(7, 6), [['YkI7']]),
    createDrop(atCell(8, 6), [['YkI8']]),

    //artifact
    createDrop(atCell(0, 8), [['YlI0']]),
    createDrop(atCell(1, 8), [['YlI1']]),
    createDrop(atCell(2, 8), [['YlI2']]),
    createDrop(atCell(3, 8), [['YlI3']]),
    createDrop(atCell(4, 8), [['YlI4']]),
    createDrop(atCell(5, 8), [['YlI5']]),
    createDrop(atCell(6, 8), [['YlI6']]),
    createDrop(atCell(7, 8), [['YlI7']]),
    createDrop(atCell(8, 8), [['YlI8']]),

    //purchasable
    createDrop(atCell(0, 10), [['YmI0']]),
    createDrop(atCell(1, 10), [['YmI1']]),
    createDrop(atCell(2, 10), [['YmI2']]),
    createDrop(atCell(3, 10), [['YmI3']]),
    createDrop(atCell(4, 10), [['YmI4']]),
    createDrop(atCell(5, 10), [['YmI5']]),
    createDrop(atCell(6, 10), [['YmI6']]),
    createDrop(atCell(7, 10), [['YmI7']]),
    createDrop(atCell(8, 10), [['YmI8']]),

    //campaign
    createDrop(atCell(0, 12), [['YnI0']]),
    createDrop(atCell(1, 12), [['YnI1']]),
    createDrop(atCell(2, 12), [['YnI2']]),
    createDrop(atCell(3, 12), [['YnI3']]),
    createDrop(atCell(4, 12), [['YnI4']]),
    createDrop(atCell(5, 12), [['YnI5']]),
    createDrop(atCell(6, 12), [['YnI6']]),
    createDrop(atCell(7, 12), [['YnI7']]),
    createDrop(atCell(8, 12), [['YnI8']]),

    //unit with no loot attached
    // createDrop(atCell(0, 15), []),

    //2 sets, 1 item per set
    createDrop(atCell(0, 18), [['YiI2'], ['YkI2']]),

    //2 sets, 2 items per set
    createDrop(atCell(0, 21), [['YkI1', 'YiI3'], ['YiI4', 'YjI2']]),

    //1 set, 2 explicit items
    createDrop(atCell(0, 24), [[Items.RingOfRegeneration, Items.TomeOfAgilityPlus2]]),

    //TODO: "Use Item Table From Map" is unsupported.
    //There is a bug - data is lost on a map save for new maps (unit loses its drop in Editor, but the LUA item drop trigger is still present).
    //Old maps save this data correctly.
    //https://github.com/ChiefOfGxBxL/WC3MapSpecification/blob/e463c7a0c6f42dcf8ced0f13f2eb3ad834b92d12/Units/8_11.md?plain=1#L26
    // "Dropped item set pointer" is an index to drop set table in the map file, it should be -1 if the unit has no Map tables attached,
    // but new Editor writes 0 (valid index) for units with no Map tables attached.
    // ItemDropData.create(atCell(0, 27), []),
];

for (let i = 0; i < expectedDropData.length; i++) {
    const expected = expectedDropData[i];
    const actual = actualDropData[i];
    assertEqual(Math.floor(actual.unitLocation.x / GRID_SIZE), Math.floor(expected.unitLocation.x / GRID_SIZE));
    assertEqual(Math.floor(actual.unitLocation.y / GRID_SIZE), Math.floor(expected.unitLocation.y / GRID_SIZE));
    assertEqual(actual.itemSets, expected.itemSets);
}

assertEqual(actualDropData.length, expectedDropData.length);

function assertEqual(actual: any, expected: any) {
    const actualJson = JSON.stringify(actual, null, 2);
    const expectedJson = JSON.stringify(expected, null, 2);
    if (actualJson !== expectedJson) {
        throw new Error(`Expected ${actualJson} to equal ${expectedJson}`);
    }
}

function atCell(x: number, y: number): Point2D {
    return {x: GRID_START.x + GRID_SIZE * x,
        y: GRID_START.y - GRID_SIZE * y};
}

function createDrop(point: Point2D, sets: string[][]): RawUnitItemDrop {
    const itemSets: RawItemDropSet[] = sets.map(itemTypes => ({itemTypes}));
    return {unitLocation: point, itemSets};
}