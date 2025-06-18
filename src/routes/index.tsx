import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<main>
			<h1>Overused Puzzle Solver</h1>
		</main>
	);
}
