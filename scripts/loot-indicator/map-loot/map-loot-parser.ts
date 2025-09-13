import UnitsDoo from "mdx-m3-viewer-th/dist/cjs/parsers/w3x/unitsdoo/file.js";
import War3MapW3i from "mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3i/file.js";
import * as fs from "fs-extra";
import type {RawItemDropSet, RawUnitItemDrop} from "../../../src/loot-indicator/modules/unit-item-drops";

export function getMapItemDrops(mapPath: string): RawUnitItemDrop[] {
    const unitsDoo = loadUnitsDoo(mapPath);
    // writeAsJson(`${mapPath}/raw-unit.json`, unitsDoo.units);
    const unitsWithDrop = unitsDoo.units.filter(unit => unit.droppedItemSets.length > 0);
    // writeAsJson(`${mapPath}/raw-unit-drops.json`, unitsWithDrop);

    //TODO: "Use Item Table From Map" is unsupported.
    // Used by "(8)WellspringTemple..."
    const itemDropData: RawUnitItemDrop[] = unitsWithDrop.map(unit => {
        const unitLocation = { x: unit.location[0], y: unit.location[1] }
        const itemSets: RawItemDropSet[] = unit.droppedItemSets.map(set => {
            return ({itemTypes: set.items.map(item => item.id)});
        });

        return {
            unitLocation,
            itemSets
        };
    });

    // writeAsJson(`${mapPath}/unit-drops.json`, itemDropData);

    return itemDropData;
}

function loadUnitsDoo(mapPath: string): UnitsDoo {
        const war3MapW3i = new War3MapW3i();
        war3MapW3i.load(fs.readFileSync(`${mapPath}/war3map.w3i`))
        // writeAsJson(`${mapPath}/war3map.w3i.json`, war3MapW3i);

        const udoo = new UnitsDoo();
        udoo.load(fs.readFileSync(`${mapPath}/war3mapUnits.doo`), war3MapW3i.getBuildVersion())
        return udoo;
}

function writeAsJson(path: string, data: any) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}