import type { ReactNode } from "react";
import styles from "./PuzzleDescription.module.css";

export const PuzzleDescription = ({ children }: { children?: ReactNode }) => {
	return (
		<section className={styles.puzzleDescription}>
			<div className={styles.puzzleDescriptionContainer}>{children}</div>
		</section>
	);
};
