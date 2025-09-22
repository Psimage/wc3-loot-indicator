import * as ignored from "./_workaround";
import {addScriptHook, W3TS_HOOK} from "w3ts/hooks";
import {enableCreepLootIndicator} from "./player_features/loot-indicator/loot-indicator";

function tsMain() {
    try {
        enableCreepLootIndicator();
    } catch (e) {
        print(e);
    }
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain);
