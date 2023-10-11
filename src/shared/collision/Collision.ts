import { WordObject } from "../WordObject";
import { Vector3 } from "@censor1337/cfx-api/shared";
import { Dispatcher } from "../utils/Dispatcher";
import { Tickpool } from "../TickPool";
import { Shape } from "../Shape";

interface listenerType {
	id: number | undefined;
	type: "enter" | "exit" | "overlapping";
}

export abstract class Collision extends WordObject {
	public static readonly all = new Array<Collision>();
	public playersOnly: boolean = false;
	public readonly id: string;
	private interval: NodeJS.Timer;
	private insideEntities: Set<number> = new Set();
	private destroyed: boolean = false;
	private listeners = {
		enter: new Dispatcher(),
		exit: new Dispatcher(),
		overlapping: new Dispatcher(),
	};
	private tickpool = new Tickpool();
	private tickpoolIds = new Map<number, number>();
	private shape: Shape;

	protected constructor(id: string, shape: Shape) {
		super(shape.pos);
		this.shape = shape;
		this.id = id;
		this.interval = setInterval(this.onTick.bind(this), 300);
		Collision.all.push(this);

		this.onBeginOverlap((entity) => {
			const poolId = this.tickpool.add(() => {
				this.listeners.overlapping.broadcast(entity);
			});
			this.tickpoolIds.set(entity, poolId);
		});

		this.onEndOverlap((entity) => {
			const poolId = this.tickpoolIds.get(entity);
			if (!poolId) return;
			this.tickpool.remove(poolId);
			this.tickpoolIds.delete(entity);
		});
	}

	public onBeginOverlap(callback: (entity: number) => void): listenerType {
		const id = this.listeners.enter.add(callback);
		return { id: id, type: "enter" };
	}

	public onOverlapping(callback: (entity: number) => void): listenerType {
		const id = this.listeners.overlapping.add(callback);
		return { id: id, type: "overlapping" };
	}

	public onEndOverlap(callback: (entity: number) => void): listenerType {
		const id = this.listeners.exit.add(callback);
		return { id: id, type: "exit" };
	}

	public off(listener: listenerType) {
		const dispatcher = this.listeners[listener.type];
		if (!dispatcher) return;
		if (listener.id === undefined) return;
		dispatcher.remove(listener.id);
	}

	public destroy() {
		this.destroyed = true;
		this.onTick();
		this.tickpool.destroy();
		const index = Collision.all.indexOf(this);
		if (index < 0) return;
		Collision.all.splice(index, 1);
	}

	private onTick() {
		if (this.destroyed) {
			// @ts-ignore
			clearInterval(this.interval);
			for (const handle of this.insideEntities) {
				this.listeners.exit.broadcast(handle);
			}
			this.insideEntities.clear();
			return;
		}

		const entities = this.getRevelantEntities();

		for (const handle of this.insideEntities) {
			const isValid = this.isEntityValid(handle);
			if (!isValid) {
				this.insideEntities.delete(handle);
				this.listeners.exit.broadcast(handle);
			}
		}

		for (const handle of entities) {
			if (this.insideEntities.has(handle)) continue;
			const isValid = this.isEntityValid(handle);
			if (isValid) {
				if (!this.insideEntities.has(handle)) {
					this.insideEntities.add(handle);
					this.listeners.enter.broadcast(handle);
				}
			}
		}
	}

	protected abstract isEntityValid(entity: number): boolean;
	protected abstract getRevelantEntities(): number[];
	public isPointIn(pos: Vector3): boolean {
		return this.shape.isPointIn(pos);
	}
}
