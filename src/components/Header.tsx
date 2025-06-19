import { Link } from "@tanstack/react-router";
import styles from "./Header.module.css";

export default function Header() {
	return (
		<header className={styles.header}>
			<nav className={styles.nav}>
				<b>
					Overused Puzzle Solver
				</b>
				<div>
					<Link to="/">Home</Link>
				</div>
				<div>
					<Link to="/lightsout">Lights Out</Link>
				</div>
				<div>
					<Link to="/ice">Ice Puzzle</Link>
				</div>
				<div>
					<Link to="/fillout">Fill Out</Link>
				</div>
				<div>
					<Link to="/play/lightsout">Play Lights Out!</Link>
				</div>
			</nav>
		</header>
	);
}
