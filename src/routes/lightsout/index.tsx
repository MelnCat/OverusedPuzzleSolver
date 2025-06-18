import { createFileRoute } from "@tanstack/react-router";
import { Matrix, inverse } from "ml-matrix";
import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import styles from "./lightsout.module.css";
import { useEventListener } from "usehooks-ts";
import { BoardEditor, type PuzzleSolution } from "@/components/BoardEditor";

export const Route = createFileRoute("/lightsout/")({
	component: App,
});

interface Coord {
	i: number;
	y: string;
	j: number;
}
const solve = (board: string[][], invert: boolean): PuzzleSolution => {
	const coords = board.flatMap((x, i) => x.flatMap((y, j) => (y === " " ? [] : { i, j, y })));
	const cache: Record<number, Record<number, Coord>> = {};
	for (const c of coords) {
		cache[c.i] ??= [];
		cache[c.i][c.j] = c;
	}
	const matrix = new Matrix(coords.map(x => coords.map(y => (x === y || (Math.abs(x.i - y.i) === 1 && x.j === y.j) || (Math.abs(x.j - y.j) === 1 && x.i === y.i) ? 1 : 0))));
	const initial = Matrix.columnVector(coords.map(x => (x.y === "X" ? 0 : 1)).map(x => (invert ? 1 - x : x)));
	const augmented = matrix.clone().addColumn(initial);
	const n = coords.length;
	for (let i = 0; i < n; i++) {
		let pivot = i;
		while (pivot < n && augmented.get(pivot, i) === 0) pivot++;
		if (pivot === n) continue;
		if (pivot !== i) augmented.swapRows(pivot, i);

		for (let j = 0; j < n; j++) {
			if (j !== i && augmented.get(j, i) === 1) {
				for (let k = i; k <= n; k++) {
					augmented.set(j, k, augmented.get(j, k) ^ augmented.get(i, k));
				}
			}
		}
	}
	if (augmented.to2DArray().some(x => x.slice(0, -1).every(y => y === 0) && x.at(-1) !== 0)) return { type: "error", error: "NO SOLUTION" };
	const solution = augmented.getColumn(n);
	return { type: "mark", nodes: coords.map((x, i) => ({ ...x, solution: solution[i] })).filter(x => x.solution === 1) };
};

function App() {
	const [board, setBoard] = useState([
		["O", "O", "O"],
		["O", "O", "O"],
		["O", "O", "O"],
	]);
	const [invert, setInvert] = useState(false);
	const solution = useMemo(() => solve(board, invert), [board, invert]);
	return (
		<main>
			<h1>Lights Out Solver</h1>
			<BoardEditor
				board={board}
				setBoard={setBoard}
				solution={solution}
				nodeTypes={{
					primary: ["O", "X"],
					secondary: [" ", "O"],
				}}
				extraButtons={[
					{
						name: `Target: All ${invert ? "ON" : "OFF"}`,
						onClick: () => {
							setInvert(x => !x);
						},
						width: "7.6em"
					},
				]}
			/>
		</main>
	);
}
