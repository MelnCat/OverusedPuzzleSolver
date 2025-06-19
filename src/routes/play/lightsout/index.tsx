import { BoardGrid } from "@/components/BoardEditor";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import styles from "./playlightsout.module.css";
import { solveLightsOut } from "@/routes/lightsout";
export const Route = createFileRoute("/play/lightsout/")({
	component: App,
});

export const lightsOutModes = ["regular", "triple", "quadruple", "quintuple", "septuple", "nonuple"] as const;
export type LightsOutMode = (typeof lightsOutModes)[number];
export const lightsOutTiles = {
	regular: ["O", "X"],
	triple: ["O", "X/2", "X"],
	quadruple: ["O", "X/3", "2X/3", "X"],
	quintuple: ["O", "X/4", "X/2", "3X/4", "X"],
	septuple: ["O", "X/6", "2X/6", "3X/6", "4X/6", "5X/6", "X"],
	nonuple: ["O", "X/8", "2X/8", "3X/8", "4X/8", "5X/8", "6X/8", "7X/8", "X"],
} as const;

const generateLightsOut = (mode: LightsOutMode = "regular") => {
	const height = Math.floor(Math.random() * 7 + 2);
	const width = Math.max(height, Math.floor(Math.random() * 7 + 2));
	const grid = [...Array(height)].map(() => [...Array(width)].map(() => (Math.random() < 0.8 ? "O" : " ")));
	const sol = solveLightsOut(grid, false, mode);
	if (sol.type === "error" || (mode !== "regular" && [...new Set(sol.nodes.map(x => x.char))].length === 1)) return generateLightsOut(mode);
	return [grid as string[][], sol] as const;
};

function App() {
	const [game, setGame] = useState(() => generateLightsOut());
	const [clicks, setClicks] = useState(0);
	const [win, setWin] = useState(false);
	const [mode, setMode] = useState<LightsOutMode>("regular");
	const generateGame = (mode: LightsOutMode) => {
		setWin(false);
		setClicks(0);
		setGame(() => generateLightsOut(mode));
	};
	return (
		<main>
			<h1>Lights Out</h1>
			<div className={styles.gameContainer}>
				<div className={styles.buttonRow}>
					<button
						onClick={() => {
							const newMode = lightsOutModes[(lightsOutModes.indexOf(mode) + 1) % lightsOutModes.length];
							setMode(newMode);
							generateGame(newMode);
						}}
					>
						Mode: {mode.toUpperCase()}
					</button>
					<button
						onClick={() => {
							generateGame(mode);
						}}
					>
						New Game
					</button>
					<button
						onClick={() => {
							setGame(x => [x[0].map(y => y.map(() => "O")), x[1]]);
						}}
					>
						Reset
					</button>
				</div>
				<BoardGrid
					board={game[0]}
					isHovered={(x, y) =>
						game[0][x[0]][x[1]] !== " " &&
						game[0][y[0]][y[1]] !== " " &&
						((x[0] === y[0] && Math.abs(x[1] - y[1]) === 1) || (x[1] === y[1] && Math.abs(x[0] - y[0]) === 1))
					}
					onClick={(i, j) => {
						if (game[0][i][j] === " ") return;
						const newGame = [
							game[0].map((y, a) =>
								y.map((z, b) =>
									z !== " " && ((a === i && Math.abs(b - j) <= 1) || (b === j && Math.abs(a - i) <= 1))
										? (lightsOutTiles[mode][(lightsOutTiles[mode].indexOf(z as "O") + 1) % lightsOutTiles[mode].length] ?? z)
										: z
								)
							),
							game[1],
						] as const;
						setGame(newGame);
						if (!win) setClicks(x => x + 1);
						if (newGame[0].flat().every(x => x === "X" || x === " ")) setWin(true);
					}}
				/>
			</div>
			{win && (
				<div className={styles.winScreen}>
					<h1>You won in {clicks} steps!</h1>
					{game[1] && <p>Optimal Solution: {game[1].nodes.reduce((l, c) => l + ("char" in c ? isNaN(+c.char!) ? c.char!.length : +c.char! : 1), 0)} Steps</p>}
					<button
						onClick={() => {
							generateGame(mode);
						}}
					>
						Play Again
					</button>
				</div>
			)}
		</main>
	);
}
