import { createFileRoute } from "@tanstack/react-router";
import { Matrix, inverse } from "ml-matrix";
import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import styles from "./lightsout.module.css";
import { useEventListener } from "usehooks-ts";
import { BoardEditor, BoardGrid, type PuzzleSolution } from "@/components/BoardEditor";
import { PuzzleDescription } from "@/components/PuzzleDescription";

export const Route = createFileRoute("/triplelightsout/")({
	component: App,
});

interface Coord {
	i: number;
	y: string;
	j: number;
}
function mod3(x: number): number {
	return ((x % 3) + 3) % 3;
}

function mod3Inv(x: number): number {
	if (x === 1) return 1;
	if (x === 2) return 2;
	throw new Error("divison ny 0");
}
export const solveTripleLightsOut = (board: string[][], invert: boolean): PuzzleSolution => {
	const coords = board.flatMap((x, i) => x.flatMap((y, j) => (y === " " ? [] : { i, j, y })));
	const cache: Record<number, Record<number, Coord>> = {};
	for (const c of coords) {
		cache[c.i] ??= [];
		cache[c.i][c.j] = c;
	}
	const matrix = new Matrix(coords.map(x => coords.map(y => (x === y || (Math.abs(x.i - y.i) === 1 && x.j === y.j) || (Math.abs(x.j - y.j) === 1 && x.i === y.i) ? 1 : 0))));
	const initial = Matrix.columnVector(coords.map(x => (x.y === "X" ? 0 : x.y === "V" ? 1 : 2)).map(x => (invert ? 2 - x : x)));
	const augmented = matrix.clone().addColumn(initial);
	const n = coords.length;
	for (let i = 0; i < n; i++) {
		let pivot = i;
		while (pivot < n && augmented.get(pivot, i) === 0) pivot++;
		if (pivot === n) continue;
		if (pivot !== i) augmented.swapRows(pivot, i);

		const pivotVal = augmented.get(i, i);
		const inv = mod3Inv(pivotVal);
		for (let k = i; k <= n; k++) {
			const val = augmented.get(i, k);
			augmented.set(i, k, mod3(val * inv));
		}

		for (let j = 0; j < n; j++) {
			if (j === i) continue;
			const factor = augmented.get(j, i);
			for (let k = i; k <= n; k++) {
				const val = augmented.get(j, k) - factor * augmented.get(i, k);
				augmented.set(j, k, mod3(val));
			}
		}
	}
	if (augmented.to2DArray().some(x => x.slice(0, -1).every(y => y === 0) && x.at(-1) !== 0)) return { type: "error", error: "NO SOLUTION" };
	const solution = augmented.getColumn(n);
	return { type: "mark", nodes: coords.map((x, i) => ({ ...x, solution: solution[i], char: "X".repeat(solution[i]) })).filter(x => x.solution ) };
};

function App() {
	const [board, setBoard] = useState([
		["O", "O", "O"],
		["O", "O", "O"],
		["O", "O", "O"],
	]);
	const [invert, setInvert] = useState(false);
	const solution = useMemo(() => solveTripleLightsOut(board, invert), [board, invert]);
	return (
		<main>
			<h1>Lights Out Solver</h1>
			<BoardEditor
				board={board}
				setBoard={setBoard}
				solution={solution}
				nodeTypes={{
					primary: ["O", "V", "X"],
					secondary: [" ", "O"],
				}}
				extraButtons={[
					{
						name: `Target: All ${invert ? "ON" : "OFF"}`,
						onClick: () => {
							setInvert(x => !x)
						},
						width: "7.6em",
					},
				]}
			/>
			<PuzzleDescription>
				<div>Lights Out puzzles consist of a grid with tiles toggled on or off. When a tile is clicked, both the tile and its neighbors will have their state toggled.</div>
				<div>The goal of the game is to either turn all of the tiles on or off.</div>
			</PuzzleDescription>
		</main>
	)
}
