import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header>
			<nav>
				<div>
					Overused Puzzle Solver
				</div>
				<div>
					<Link to="/">Home</Link>
				</div>
				<div>
					<Link to="/lightsout">Lights Out</Link>
				</div>
			</nav>
		</header>
	);
}
