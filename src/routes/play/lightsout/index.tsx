import { BoardGrid } from "@/components/BoardEditor";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import styles from "./playlightsout.module.css";
import { solveLightsOut } from "@/routes/lightsout";
import { solveTripleLightsOut } from "@/routes/triplelightsout";
export const Route = createFileRoute("/play/lightsout/")({
	component: App,
});

const generateLightsOut = (mode: "regular" | "triple" = "regular") => {
	const width = Math.floor(Math.random() * 6 + 3);
	const height = Math.floor(Math.random() * 6 + 3);
	const grid = [...Array(height)].map(() => [...Array(width)].map(() => (Math.random() < 0.8 ? "O" : " ")));
	const sol = mode === "regular" ? solveLightsOut(grid, false) : solveTripleLightsOut(grid, false);
	if (sol.type === "error") return generateLightsOut(mode);
	return [grid as string[][], sol] as const;
};

function App() {
	const [game, setGame] = useState(() => generateLightsOut());
	const [clicks, setClicks] = useState(0);
	const [win, setWin] = useState(false);
	const [mode, setMode] = useState<"regular" | "triple">("regular");
	const generateGame = (mode: "regular" | "triple") => {
		setWin(false);
		setClicks(0);
		setGame(() => generateLightsOut(mode));
	};
	return (
		<main>
			<h1>Lights Out</h1>
			<div className={styles.gameContainer}>
				<button
					onClick={() => {
						setMode(x => (x === "regular" ? "triple" : "regular"));
						generateGame(mode === "regular" ? "triple" : "regular");
					}}
				>
					Mode: {mode.toUpperCase()}
				</button>
				<BoardGrid
					board={game[0]}
					isHovered={(x, y) =>
						game[0][x[0]][x[1]] !== " " &&
						game[0][y[0]][y[1]] !== " " &&
						((x[0] === y[0] && Math.abs(x[1] - y[1]) === 1) || (x[1] === y[1] && Math.abs(x[0] - y[0]) === 1))
					}
					onClick={(i, j) => {
						if (game[0][i][j] === " ") return;
						setGame(x => [
							x[0].map((y, a) =>
								y.map((z, b) =>
									(a === i && Math.abs(b - j) <= 1) || (b === j && Math.abs(a - i) <= 1)
										? ((mode === "regular" ? { O: "X", X: "O" } : { O: "V", V: "X", X: "O" })[z as "O"] ?? z)
										: z
								)
							),
							x[1],
						]);
						if (!win) setClicks(x => x + 1);
						if (game[0].flat().every(x => x !== "O" && x !== "V")) setWin(true);
					}}
				/>
			</div>
			<div className={styles.winScreen} style={{ display: win ? "" : "none" }}>
				<h1>You won in {clicks} steps!</h1>
				<p>Optimal Solution: {game[1].nodes.reduce((l, c) => l + ("char" in c ? c.char!.length : 1), 0)} Steps</p>
				<button
					onClick={() => {
						generateGame(mode);
					}}
				>
					Play Again
				</button>
			</div>
		</main>
	);
}
