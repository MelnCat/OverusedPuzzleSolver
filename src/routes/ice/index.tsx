import { createFileRoute } from "@tanstack/react-router";
import { Matrix, inverse } from "ml-matrix";
import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import styles from "./ice.module.css";
import { useEventListener } from "usehooks-ts";
import { BoardEditor, type PuzzleSolution } from "@/components/BoardEditor";
import { PuzzleDescription } from "@/components/PuzzleDescription";

export const Route = createFileRoute("/ice/")({
	component: App,
});

const solve = (board: string[][], edges: boolean): PuzzleSolution => {
	if (!board.flat().includes("S") || !board.flat().includes("E")) return { type: "error", error: "NO START/END POSITION" };
	if (board.flat().filter(x => x === "S").length > 1 || board.flat().filter(x => x === "E").length > 1) return { type: "error", error: "TOO MANY START/END POSITIONS" };
	const tiles = board.flatMap((x, i) => x.map((y, j) => ({ tile: y, i, j })));
	const cache: Record<number, Record<number, { tile: string; i: number; j: number }>> = {};
	for (const tile of tiles) {
		cache[tile.i] ??= {};
		cache[tile.i][tile.j] = tile;
	}
	const currIndex = [board.findIndex(x => x.includes("S")), board.find(x => x.includes("S"))!.indexOf("S")];
	const states = [{ current: currIndex, seen: [] as { tile: string; i: number; j: number }[] }];
	while (states.length) {
		const last = states.shift()!;
		const dirs = [
			[0, 1],
			[0, -1],
			[1, 0],
			[-1, 0],
		];
		for (const dir of dirs) {
			let currPos = [last.current[0], last.current[1]];
			let nextPos = [currPos[0] + dir[0], currPos[1] + dir[1]];
			const seen = last.seen.slice(0);
			seen.push(cache[last.current[0]][last.current[1]]);
			while (cache[nextPos[0]]?.[nextPos[1]]?.tile === "I") {
				currPos = nextPos;
				nextPos = [nextPos[0] + dir[0], nextPos[1] + dir[1]];
			}
			const wall = (cache[nextPos[0]]?.[nextPos[1]] === undefined && edges) || cache[nextPos[0]]?.[nextPos[1]]?.tile === "W";
			if (!wall) {
				if (cache[nextPos[0]]?.[nextPos[1]]?.tile === "E") return { type: "path", nodes: seen.concat(cache[nextPos[0]][nextPos[1]]) };
				continue;
			}
			if (last.seen.includes(cache[currPos[0]][currPos[1]])) continue;
			states.push({ current: currPos, seen });
		}
	}
	return { type: "error", error: "NO SOLUTION" };
};

function App() {
	const [board, setBoard] = useState([
		["W", "I", "I", "E"],
		["I", "I", "W", "I"],
		["S", "I", "I", "W"],
	]);
	const [edges, setEdges] = useState(true);
	const solution = useMemo(() => solve(board, edges), [board, edges]);
	return (
		<main>
			<h1>Ice Puzzle Solver</h1>
			<BoardEditor
				board={board}
				setBoard={setBoard}
				solution={solution}
				nodeTypes={{ primary: ["I", "W"], secondary: ["S", "E"] }}
				extraButtons={[{ name: `Edge Walls: ${edges ? "ON" : "OFF"}`, onClick: () => setEdges(x => !x), width: "8.4em" }]}
			/>
			<PuzzleDescription>
				<div>Ice puzzles consist of a frictionless surface where the goal is to reach an endpoint from a starting point.</div>
				<div>The lack of friction results in all movements continuing until stopping from a wall collision.</div>
			</PuzzleDescription>
		</main>
	);
}
