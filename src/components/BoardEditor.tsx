import { useRef, type Dispatch, type SetStateAction, type MouseEvent } from "react";
import { useEventListener } from "usehooks-ts";
import styles from "./BoardEditor.module.css";
import type { ReactNode } from "@tanstack/react-router";

export type NodeType = " " | "X" | "O" | "S" | "E" | "W" | "I";
export type PuzzleSolution = { type: "error"; error: string } | { type: "path"; nodes: { i: number; j: number }[] } | { type: "mark"; nodes: { i: number; j: number }[] };

export const BoardGrid = ({
	board,
	onClick,
	extraContents,
	extraSiblings,
}: {
	board: string[][];
	onClick: (i: number, j: number, y: string, b: number) => void;
	extraContents?: { i: number; j: number; node: ReactNode }[];
	extraSiblings?: { i: number; j: number; node: ReactNode }[];
}) => {
	const mouseDownRef = useRef<false | number>(false);
	useEventListener("mouseup", () => {
		mouseDownRef.current = false;
	});
	return (
		<div
			className={styles.boardGrid}
			style={{ "--rows": board[0].length }}
			onMouseDown={e => {
				mouseDownRef.current = e.button;
			}}
		>
			{board.flatMap((x, i) =>
				x.map((y, j) => (
					<div className={styles.boardGridItemContainer} key={`${i},${j}`}>
						<div
							className={styles.boardGridItem}
							onMouseDown={e => {
								onClick(i, j, y, e.button);
							}}
							onContextMenu={e => {
								e.preventDefault();
							}}
							onMouseEnter={e => {
								if (mouseDownRef.current !== false) onClick(i, j, y, mouseDownRef.current);
							}}
							style={{ gridRow: i + 1, gridColumn: j + 1 }}
							data-state={
								{
									W: "wall",
									S: "start",
									" ": "empty",
									I: "ice",
									X: "off",
									O: "on",
									E: "end",
								}[y]
							}
						>
							{{ S: "START", E: "END" }[y] && <div className={styles.smallContent}>{{ S: "START", E: "END" }[y]}</div>}
							{extraContents?.find(x => x.i === i && x.j === j)?.node}
						</div>
						{extraSiblings?.find(x => x.i === i && x.j === j)?.node}
					</div>
				))
			)}
		</div>
	);
};

export const BoardEditor = ({
	board,
	setBoard,
	extraButtons,
	solution,
	nodeTypes,
}: {
	board: string[][];
	setBoard: Dispatch<SetStateAction<string[][]>>;
	extraButtons?: { name: string; onClick: (e: MouseEvent) => void; width?: string }[];
	solution: PuzzleSolution;
	nodeTypes: {
		primary: NodeType[];
		secondary?: NodeType[];
	};
}) => {
	return (
		<section className={styles.board}>
			<div className={styles.boardButtons}>
				<button onClick={() => setBoard(x => x.concat([x[0].map(() => " ")]))}>+ Row</button>
				<button onClick={() => setBoard(x => (x.length > 1 ? x.slice(0, -1) : x))}>- Row</button>
				<button onClick={() => setBoard(x => x.map(y => y.concat(" ")))}>+ Column</button>
				<button onClick={() => setBoard(x => (x[0].length > 1 ? x.map(y => y.slice(0, -1)) : x))}>- Column</button>
				<button onClick={() => setBoard(x => x.map(y => y.map(() => " ")))}>Clear</button>
				{extraButtons?.map(x => (
					<button key={x.name} onClick={x.onClick} style={{ width: x.width }}>
						{x.name}
					</button>
				))}
			</div>
			<BoardGrid
				board={board}
				onClick={(i, j, y, b) => {
					if (b === 0 || !nodeTypes.secondary)
						setBoard(z =>
							z.with(i, z[i].with(j, nodeTypes.primary[(nodeTypes.primary.indexOf(y as NodeType) + 1) % nodeTypes.primary.length] ?? nodeTypes.primary[0]))
						);
					if (b === 2)
						setBoard(z =>
							z.with(i, z[i].with(j, nodeTypes.secondary![(nodeTypes.secondary!.indexOf(y as NodeType) + 1) % nodeTypes.secondary!.length] ?? nodeTypes.primary[0]))
						);
				}}
				extraContents={solution.type === "mark" ? solution.nodes.map(x => ({ i: x.i, j: x.j, node: <div>X</div> })) : []}
				extraSiblings={
					solution.type === "path"
						? solution.nodes.map(({ i, j }) => {
								const found = solution.nodes.findIndex(x => x.i === i && x.j === j);
								const x = solution.nodes[found];
								const y = solution.nodes[found + 1] ?? x;
								const type = x === y ? "" : x.i === y.i ? "h" : "v";
								const length = type === "v" ? Math.abs(y.i - x.i) : Math.abs(y.j - x.j);
								return {
									i,
									j,
									node: (
										<div
											className={styles.line}
											key={`s${x.i},${x.j}`}
											style={{
												gridRow: x.i + 1,
												gridColumn: x.j + 1,
												width: type === "h" ? `calc(${length} * 2em + ${Math.max(0, length)} * 0.15em)` : undefined,
												height: type === "v" ? `calc(${length} * 2em + ${Math.max(0, length)} * 0.15em)` : undefined,
												// Honestly I have no idea how I actually got this calculation correct

												[(x.i < y.i ? "top" : "bottom") as "top"]: "calc(50% - var(--thickness) / 2)",
												[(x.j < y.j ? "left" : "right") as "left"]: "calc(50% - var(--thickness) / 2)",
											}}
										></div>
									),
								};
							})
						: []
				}
			/>
			{solution.type === "error" && <div className={styles.noSolution}>{solution.error}</div>}
		</section>
	);
};
