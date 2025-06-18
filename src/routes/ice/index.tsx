import { createFileRoute } from "@tanstack/react-router";
import { Matrix, inverse } from "ml-matrix";
import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import styles from "./ice.module.css";
import { useEventListener } from "usehooks-ts";

export const Route = createFileRoute("/ice/")({
	component: App,
});

const solve = (board: string[][], edges: boolean) => {
	if (!board.flat().includes("S") || !board.flat().includes("E")) return "NO START/END POSITION";
	if (board.flat().filter(x => x === "S").length > 1 || board.flat().filter(x => x === "E").length > 1) return "TOO MANY START/END POSITIONS";
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
			while (cache[nextPos[0]]?.[nextPos[1]]?.tile === " ") {
				currPos = nextPos;
				nextPos = [nextPos[0] + dir[0], nextPos[1] + dir[1]];
			}
			const wall = (cache[nextPos[0]]?.[nextPos[1]] === undefined && edges) || cache[nextPos[0]]?.[nextPos[1]]?.tile === "W";
			if (!wall) {
				if (cache[nextPos[0]]?.[nextPos[1]]?.tile === "E")
					return last.seen.concat(cache[last.current[0]][last.current[1]]).concat(cache[currPos[0]][currPos[1]]).concat(cache[nextPos[0]][nextPos[1]]);
				continue;
			}
			if (last.seen.includes(cache[currPos[0]][currPos[1]])) continue;
			states.push({ current: currPos, seen: last.seen.concat(cache[last.current[0]][last.current[1]]) });
		}
	}
	return "NO SOLUTION";
};

const BoardEditor = ({
	board,
	setBoard,
	edges,
	setEdges,
	solution,
}: {
	board: string[][];
	setBoard: Dispatch<SetStateAction<string[][]>>;
	edges: boolean;
	setEdges: Dispatch<SetStateAction<boolean>>;
	solution:
		| {
				tile: string;
				i: number;
				j: number;
		  }[]
		| string;
}) => {
	const mouseDownRef = useRef<false | number>(false);
	useEventListener("mouseup", () => {
		mouseDownRef.current = false;
	});
	const sol = typeof solution === "string" ? null : solution;
	console.log(sol);
	return (
		<section className={styles.board}>
			<div className={styles.boardButtons}>
				<button onClick={() => setBoard(x => x.concat([x[0].map(() => " ")]))}>+ Row</button>
				<button onClick={() => setBoard(x => (x.length > 1 ? x.slice(0, -1) : x))}>- Row</button>
				<button onClick={() => setBoard(x => x.map(y => y.concat(" ")))}>+ Column</button>
				<button onClick={() => setBoard(x => (x[0].length > 1 ? x.map(y => y.slice(0, -1)) : x))}>- Column</button>
				<button
					onClick={() => {
						setEdges(x => !x);
					}}
					style={{ width: "7.6em" }}
				>
					Edge Walls: {edges ? "ON" : "OFF"}
				</button>
			</div>
			<div
				className={styles.boardGrid}
				style={{ "--rows": board[0].length }}
				onMouseDown={e => {
					mouseDownRef.current = e.button;
				}}
			>
				{board.flatMap((x, i) =>
					x.map((y, j) => (
						<div
							className={styles.boardGridItem}
							key={`${i},${j}`}
							onMouseDown={e => {
								if (e.button === 0) setBoard(z => z.with(i, z[i].with(j, y === " " ? "W" : " ")));
								if (e.button === 2) setBoard(z => z.with(i, z[i].with(j, y === "S" ? "E" : y === "E" ? " " : "S")));
							}}
							onContextMenu={e => {
								e.preventDefault();
							}}
							onMouseEnter={() => {
								if (mouseDownRef.current === 0) setBoard(z => z.with(i, z[i].with(j, y === " " ? "W" : " ")));
								if (mouseDownRef.current === 2) setBoard(z => z.with(i, z[i].with(j, y === "S" ? "E" : y === "E" ? " " : "S")));
							}}
							style={{ backgroundColor: sol?.some(x => x.i === i && x.j === j) ? "red" : "" }}
							data-state={y === "W" ? "wall" : y === " " ? "ground" : y === "S" ? "start" : y === "E" ? "end" : null}
						>
							<div>{y === "S" ? "START" : y === "E" ? "END" : ""}</div>
						</div>
					))
				)}
			</div>
		</section>
	);
};

function App() {
	const [board, setBoard] = useState([
		["W", " ", " ", "E"],
		[" ", " ", "W", " "],
		["S", " ", " ", " "],
	]);
	const [edges, setEdges] = useState(true);
	const solution = useMemo(() => solve(board, edges), [board, edges]);
	return (
		<main>
			<h1>Lights Out Solver</h1>
			<BoardEditor board={board} setBoard={setBoard} edges={edges} setEdges={setEdges} solution={solution} />
			{typeof solution === "string" && <div className={styles.noSolution}>{solution}</div>}
		</main>
	);
}
