import { createFileRoute } from "@tanstack/react-router";
import { Matrix, inverse } from "ml-matrix";
import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import styles from "./lightsout.module.css";
import { useEventListener } from "usehooks-ts";

export const Route = createFileRoute("/lightsout/")({
	component: App,
});

interface Coord {
	i: number;
	y: string;
	j: number;
}
const solve = (board: string[][]) => {
	const coords = board.flatMap((x, i) => x.flatMap((y, j) => (y === " " ? [] : { i, j, y })));
	const cache: Record<number, Record<number, Coord>> = {};
	for (const c of coords) {
		cache[c.i] ??= [];
		cache[c.i][c.j] = c;
	}
	const matrix = new Matrix(coords.map(x => coords.map(y => (x === y || (Math.abs(x.i - y.i) === 1 && x.j === y.j) || (Math.abs(x.j - y.j) === 1 && x.i === y.i) ? 1 : 0))));
	const initial = Matrix.columnVector(coords.map(x => (x.y === "X" ? 0 : 1)));
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
	if (augmented.to2DArray().some(x => x.slice(0, -1).every(y => y === 0) && x.at(-1) !== 0)) return null;
	const solution = augmented.getColumn(n);
	return coords.map((x, i) => ({ ...x, solution: solution[i] }));
};

const BoardEditor = ({
	board,
	setBoard,
	solution,
}: {
	board: string[][];
	setBoard: Dispatch<SetStateAction<string[][]>>;
	solution:
		| {
				solution: number;
				i: number;
				j: number;
		  }[]
		| null;
}) => {
	const [invert, setInvert] = useState(false);
	const mouseDownRef = useRef<false | number>(false);
	useEventListener("mouseup", () => {
		mouseDownRef.current = false;
	});

	return (
		<section className={styles.board}>
			<div className={styles.boardButtons}>
				<button onClick={() => setBoard(x => x.concat([x[0].map(() => " ")]))}>+ Row</button>
				<button onClick={() => setBoard(x => (x.length > 1 ? x.slice(0, -1) : x))}>- Row</button>
				<button onClick={() => setBoard(x => x.map(y => y.concat(" ")))}>+ Column</button>
				<button onClick={() => setBoard(x => (x[0].length > 1 ? x.map(y => y.slice(0, -1)) : x))}>- Column</button>
				<button
					onClick={() => {
						setInvert(x => !x);
						setBoard(x => x.map(y => y.map(z => (z === "O" ? "X" : z === "X" ? "O" : z))));
					}}
					style={{ width: "7.6em" }}
				>
					Target: All {invert ? "ON" : "OFF"}
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
								if (e.button === 0) setBoard(z => z.with(i, z[i].with(j, y === "O" ? "X" : "O")));
								if (e.button === 2) setBoard(z => z.with(i, z[i].with(j, y === " " ? "O" : " ")));
							}}
							onContextMenu={e => {
								e.preventDefault();
							}}
							onMouseEnter={() => {
								if (mouseDownRef.current === 0) setBoard(z => z.with(i, z[i].with(j, y === "O" ? "X" : "O")));
								if (mouseDownRef.current === 2) setBoard(z => z.with(i, z[i].with(j, y === " " ? "O" : " ")));
							}}
							data-state={y === "O" ? (invert ? "off" : "on") : y === "X" ? (invert ? "on" : "off") : "empty"}
						>
							<div>{solution?.find(x => x.i === i && x.j === j)?.solution ? "X" : ""}</div>
						</div>
					))
				)}
			</div>
		</section>
	);
};

function App() {
	const [board, setBoard] = useState([
		["O", "O", "O"],
		["O", "O", "O"],
		["O", "O", "O"],
	]);
	const solution = useMemo(() => solve(board), [board]);
	return (
		<main>
			<h1>Lights Out Solver</h1>
			<BoardEditor board={board} setBoard={setBoard} solution={solution} />
			{solution === null && <div className={styles.noSolution}>NO SOLUTION</div>}
		</main>
	);
}
