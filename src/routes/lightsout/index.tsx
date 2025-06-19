import { BoardEditor, type ErrorPuzzleSolution, type MarkPuzzleSolution } from "@/components/BoardEditor";
import { PuzzleDescription } from "@/components/PuzzleDescription";
import { gfMatrixGaussian } from "@/util/math";
import { createFileRoute } from "@tanstack/react-router";
import { Matrix } from "ml-matrix";
import { useMemo, useState } from "react";
import { lightsOutModes, lightsOutTiles, type LightsOutMode } from "../play/lightsout";

export const Route = createFileRoute("/lightsout/")({
	component: App,
});

interface Coord {
	i: number;
	y: string;
	j: number;
}
export const solveLightsOut = (board: string[][], invert: boolean, mode: LightsOutMode): MarkPuzzleSolution | ErrorPuzzleSolution => {
	const gf = {
		regular: 2,
		triple: 3,
		quadruple: 4,
		quintuple: 5,
		septuple: 7,
		nonuple: 9
	}[mode];
	const coords = board.flatMap((x, i) => x.flatMap((y, j) => (y === " " ? [] : { i, j, y })));
	const cache: Record<number, Record<number, Coord>> = {};
	for (const c of coords) {
		cache[c.i] ??= [];
		cache[c.i][c.j] = c;
	}
	const matrix = new Matrix(coords.map(x => coords.map(y => (x === y || (Math.abs(x.i - y.i) === 1 && x.j === y.j) || (Math.abs(x.j - y.j) === 1 && x.i === y.i) ? 1 : 0))));
	const initial = Matrix.columnVector(coords.map(x => lightsOutTiles[mode].indexOf(x.y as "X")).map(x => (invert ? x : gf - 1 - x)));
	const augmented = matrix.clone().addColumn(initial);
	const echelon = gfMatrixGaussian(augmented, gf);
	if (!echelon || echelon.to2DArray().some(x => x.slice(0, -1).every(y => y === 0) && x.at(-1) !== 0)) return { type: "error", error: "NO SOLUTION" };
	const solution = echelon.getColumn(coords.length);
	const useNumbers = solution.some(x => x > 4);
	return { type: "mark", nodes: coords.map((x, i) => ({ ...x, solution: solution[i], char: useNumbers ? solution[i].toString() : "X".repeat(solution[i]) })).filter(x => x.solution >= 1) };
};

function App() {
	const [board, setBoard] = useState([
		["O", "O", "O"],
		["O", "O", "O"],
		["O", "O", "O"],
	]);
	const [mode, setMode] = useState<LightsOutMode>("regular");
	const [invert, setInvert] = useState(false);
	const solution = useMemo(() => solveLightsOut(board, invert, mode), [board, invert, mode]);
	return (
		<main>
			<h1>Lights Out Solver</h1>
			<BoardEditor
				board={board}
				setBoard={setBoard}
				solution={solution}
				nodeTypes={{
					primary: lightsOutTiles[mode],
					secondary: [" ", "O"],
				}}
				extraButtons={[
					{
						name: `Target: All ${invert ? "ON" : "OFF"}`,
						onClick: () => {
							setInvert(x => !x);
						},
						width: "7.6em",
					},
					{
						name: `Mode: ${mode.toUpperCase()}`,
						onClick: () => {
							const newMode = lightsOutModes[(lightsOutModes.indexOf(mode) + 1) % lightsOutModes.length];
							setMode(newMode);
							setBoard(x => x.map(y => y.map(z => lightsOutTiles[newMode].includes(z as "X") || z === " " ? z : "X")))
						},
						width: "10em",
					},
				]}
			/>
			<PuzzleDescription>
				<div>Lights Out puzzles consist of a grid with tiles toggled on or off. When a tile is clicked, both the tile and its neighbors will have their state toggled.</div>
				<div>The goal of the game is to either turn all of the tiles on or off.</div>
			</PuzzleDescription>
		</main>
	);
}
