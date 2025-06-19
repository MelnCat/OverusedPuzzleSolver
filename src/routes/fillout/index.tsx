import { BoardEditor, type PuzzleSolution } from "@/components/BoardEditor";
import { PuzzleDescription } from "@/components/PuzzleDescription";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/fillout/")({
	component: App,
});

const solve = (board: string[][]): PuzzleSolution => {
	if (board.flat().filter(x => x === "S").length > 1 || board.flat().filter(x => x === "E").length > 1) return { type: "error", error: "TOO MANY START/END POSITIONS" };
	const start = board.flat().some(x => x === "S") ? [board.findIndex(x => x.includes("S")), board.find(x => x.includes("S"))!.indexOf("S")] : null;
	const end = board.flat().some(x => x === "E") ? [board.findIndex(x => x.includes("E")), board.find(x => x.includes("E"))!.indexOf("E")] : null;
	const tiles = board.flatMap((x, i) => x.map((y, j) => ({ tile: y, i, j }))).filter(x => x.tile !== " ");
	const cache: Record<number, Record<number, { tile: string; i: number; j: number }>> = {};
	for (const tile of tiles) {
		cache[tile.i] ??= {};
		cache[tile.i][tile.j] = tile;
	}
	const dirs = [
		[0, 1],
		[0, -1],
		[1, 0],
		[-1, 0],
	];
	const states = start
		? [{ current: start, unfilled: tiles.filter(x => x.i !== start[0] || x.j !== start[1]), path: [start] }]
		: tiles
				.filter(x => {
					const neighbors = dirs.map(y => [y[0] + x.i, y[1] + x.j]);
					return neighbors.some(y => !cache[y[0]]?.[y[1]]);
				})
				.map(x => ({ current: [x.i, x.j], unfilled: tiles.filter(y => y !== x), path: [[x.i, x.j]] }));
	while (states.length) {
		const last = states.pop()!;
		if (last.unfilled.length === 0 && (end === null || (end[0] === last.current[0] && end[1] === last.current[1])))
			return { type: "path", nodes: last.path.map(x => ({ i: x[0], j: x[1] })) };
		for (const dir of dirs) {
			const pos = [dir[0] + last.current[0], dir[1] + last.current[1]];
			if (!last.unfilled.includes(cache[pos[0]]?.[pos[1]])) continue;
			states.push({ current: pos, unfilled: last.unfilled.filter(x => x !== cache[pos[0]]?.[pos[1]]), path: last.path.concat([pos]) });
		}
	}
	return { type: "error", error: "NO SOLUTION" };
};

function App() {
	const [board, setBoard] = useState([
		["O", "O", "O", "O", " "],
		["O", "O", "O", "O", "O"],
		["O", "O", "O", "O", "O"],
		[" ", "O", "O", "O", "O"],
	]);
	const solution = useMemo(() => solve(board), [board]);
	return (
		<main>
			<h1>Fill Out Solver</h1>
			<BoardEditor board={board} setBoard={setBoard} solution={solution} nodeTypes={{ primary: ["O", " "], secondary: ["S", "E"] }} />
			<PuzzleDescription>
				<div>Fill out puzzles consist of a grid of tiles with the goal of stepping on each tile exactly once.</div>
				<div>Start and end points can be optionally specified.</div>
			</PuzzleDescription>
		</main>
	);
}
