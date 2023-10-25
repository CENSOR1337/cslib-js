import { Vector3 } from "@censor1337/cfx-api/shared";
import { WordObject } from "./WordObject";
import { appendInternalNamespace } from "./enum";

export const VirtualEntityEvent = {
    onStreamIn: appendInternalNamespace("on_ve_stream_in"),
    onStreamOut: appendInternalNamespace("on_ve_stream_out"),
    onSyncedMetaChange: appendInternalNamespace("on_ve_synced_meta_change"),
};

export class VirtualEntity extends WordObject {
    public static readonly type = "VIRTUAL_ENTITY";
    public readonly type = "VIRTUAL_ENTITY";
    protected readonly veType: string;
    private _destroyed = false;

    constructor(veType: string, pos: Vector3, dimension?: number) {
        super(pos, dimension);
        if (!veType) throw new Error("VirtualEntity must have a virtualEntityType");
        this.veType = veType;
    }

    public get destroyed() {
        return this._destroyed;
    }

    public destroy() {
        this._destroyed = true;
    }
}
