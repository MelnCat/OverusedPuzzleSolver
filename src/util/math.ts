import type Matrix from "ml-matrix";

// up to 23
const inverse = {
	1: [-1],
	2: [-1, 1],
	3: [-1, 1, 2],
	4: [-1, 1, -1, 3],
	5: [-1, 1, 3, 2, 4],
	6: [-1, 1, -1, -1, -1, 5],
	7: [-1, 1, 4, 5, 2, 3, 6],
	8: [-1, 1, -1, 3, -1, 5, -1, 7],
	9: [-1, 1, 5, -1, 7, 2, -1, 4, 8],
	10: [-1, 1, -1, 7, -1, -1, -1, 3, -1, 9],
	11: [-1, 1, 6, 4, 3, 9, 2, 8, 7, 5, 10],
	12: [-1, 1, -1, -1, -1, 5, -1, 7, -1, -1, -1, 11],
	13: [-1, 1, 7, 9, 10, 8, 11, 2, 5, 3, 4, 6, 12],
	14: [-1, 1, -1, 5, -1, 3, -1, -1, -1, 11, -1, 9, -1, 13],
	15: [-1, 1, 8, -1, 4, -1, -1, 13, 2, -1, -1, 11, -1, 7, 14],
	16: [-1, 1, -1, 11, -1, 13, -1, 7, -1, 9, -1, 3, -1, 5, -1, 15],
	17: [-1, 1, 9, 6, 13, 7, 3, 5, 15, 2, 12, 14, 10, 4, 11, 8, 16],
	18: [-1, 1, -1, -1, -1, 11, -1, 13, -1, -1, -1, 5, -1, 7, -1, -1, -1, 17],
	19: [-1, 1, 10, 13, 5, 4, 16, 11, 12, 17, 2, 7, 8, 3, 15, 14, 6, 9, 18],
	20: [-1, 1, -1, 7, -1, -1, -1, 3, -1, 9, -1, 11, -1, 17, -1, -1, -1, 13, -1, 19],
	21: [-1, 1, 11, -1, 16, 17, -1, -1, 8, -1, 19, 2, -1, 13, -1, -1, 4, 5, -1, 10, 20],
	22: [-1, 1, -1, 15, -1, 9, -1, 19, -1, 5, -1, -1, -1, 17, -1, 3, -1, 13, -1, 7, -1, 21],
	23: [-1, 1, 12, 8, 6, 14, 4, 10, 3, 18, 7, 21, 2, 16, 5, 20, 13, 19, 9, 17, 15, 11, 22],
};
// Not my code
export const gfMatrixGaussian = (matrix: Matrix, gf: number) => {
    matrix = matrix.clone();
    const mod = (x: number) => ((x % gf) + gf) % gf;
    
    // Helper functions
    const gcd = (a: number, b: number): number => {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b !== 0) [a, b] = [b, a % b];
        return a;
    };

    const extendedGcd = (a: number, b: number): [number, number, number] => {
        a = Math.abs(a);
        b = Math.abs(b);
        let [x0, x1, y0, y1] = [1, 0, 0, 1];
        while (b !== 0) {
            const q = Math.floor(a / b);
            [a, b] = [b, a % b];
            [x0, x1] = [x1, x0 - q * x1];
            [y0, y1] = [y1, y0 - q * y1];
        }
        return [a, x0, y0];
    };

    const modInverse = (a: number, n: number): number => {
        a = mod(a);
        const [g, x] = extendedGcd(a, n);
        if (g !== 1) throw new Error("Inverse doesn't exist");
        return mod(x);
    };

    const rows = matrix.rows;
    const cols = matrix.columns;
    const pivotInfo: { row: number; col: number; g: number }[] = [];
    let r = 0;

    // Convert to ℤₙ
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            matrix.set(i, j, mod(matrix.get(i, j)));
        }
    }

    // Forward elimination
    for (let c = 0; c < cols && r < rows; c++) {
        // Find best pivot (smallest GCD with gf)
        let bestRow = -1;
        let bestG = gf + 1;
        for (let i = r; i < rows; i++) {
            const elem = matrix.get(i, c);
            if (elem === 0) continue;
            const g = gcd(elem, gf);
            if (g < bestG) {
                bestG = g;
                bestRow = i;
                if (g === 1) break; // Found optimal pivot
            }
        }
        if (bestRow === -1) continue;

        matrix.swapRows(bestRow, r);
        const pivotVal = matrix.get(r, c);
        const gVal = bestG;

        // Normalize invertible pivots
        if (gVal === 1) {
            const inv = modInverse(pivotVal, gf);
            for (let j = c; j < cols; j++) {
                matrix.set(r, j, mod(matrix.get(r, j) * inv));
            }
        }

        // Eliminate below
        for (let i = r + 1; i < rows; i++) {
            const elem = matrix.get(i, c);
            if (elem === 0) continue;

            if (gVal === 1) {
                // Standard elimination for invertible pivot
                const factor = matrix.get(i, c);
                for (let j = c; j < cols; j++) {
                    const val = mod(matrix.get(i, j) - mod(factor * matrix.get(r, j)));
                    matrix.set(i, j, val);
                }
            } else if (elem % gVal === 0) {
                // Special handling for non-invertible pivot
                const p = pivotVal;
                const pPrime = p / gVal;
                const ePrime = elem / gVal;
                const nPrime = gf / gVal;
                try {
                    const k = mod(ePrime * modInverse(pPrime, nPrime));
                    for (let j = c; j < cols; j++) {
                        const val = mod(matrix.get(i, j) - mod(k * matrix.get(r, j)));
                        matrix.set(i, j, val);
                    }
                } catch (e) {
                }
            }
        }

        pivotInfo.push({ row: r, col: c, g: gVal });
        r++;
    }

    // Backward elimination
    pivotInfo.sort((a, b) => b.row - a.row); // Bottom to top
    for (const { row: r0, col: c0, g: g0 } of pivotInfo) {
        for (let i = 0; i < r0; i++) {
            const elem = matrix.get(i, c0);
            if (elem === 0) continue;

            if (g0 === 1) {
                // Standard elimination for invertible pivot
                const factor = matrix.get(i, c0);
                for (let j = c0; j < cols; j++) {
                    const val = mod(matrix.get(i, j) - mod(factor * matrix.get(r0, j)));
                    matrix.set(i, j, val);
                }
            } else if (elem % g0 === 0) {
                // Special handling for non-invertible pivot
                const p0 = matrix.get(r0, c0);
                const pPrime = p0 / g0;
                const ePrime = elem / g0;
                const nPrime = gf / g0;
                try {
                    const k = mod(ePrime * modInverse(pPrime, nPrime));
                    for (let j = c0; j < cols; j++) {
                        const val = mod(matrix.get(i, j) - mod(k * matrix.get(r0, j)));
                        matrix.set(i, j, val);
                    }
                } catch (e) {
                }
            }
        }
    }

    // Final normalization for invertible pivots
    for (const { row: r0, col: c0 } of pivotInfo) {
        const elem = matrix.get(r0, c0);
        if (gcd(elem, gf) === 1) {
            const inv = modInverse(elem, gf);
            for (let j = c0; j < cols; j++) {
                matrix.set(r0, j, mod(matrix.get(r0, j) * inv));
            }
        }
    }

    return matrix;
};