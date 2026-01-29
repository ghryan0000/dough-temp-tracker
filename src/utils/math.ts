export const gaussianEliminationPivot = (A: number[][], b: number[]): number[] | null => {
    const n = A.length;
    // Create augmented matrix
    const Ab = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
        // Pivot selection
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) maxRow = k;
        }

        // Swap rows
        [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];

        // Singular or nearly singular check
        if (Math.abs(Ab[i][i]) < 1e-12) return null;

        // Eliminate column i in subsequent rows
        for (let k = i + 1; k < n; k++) {
            const factor = Ab[k][i] / Ab[i][i];
            for (let j = i; j <= n; j++) Ab[k][j] -= factor * Ab[i][j];
        }
    }

    // Back-substitution
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = Ab[i][n];
        for (let j = i + 1; j < n; j++) x[i] -= Ab[i][j] * x[j];
        x[i] /= Ab[i][i];
        if (!isFinite(x[i])) return null;
    }
    return x;
};

export const solveRobust = (X: number[][], y: number[]): number[] | null => {
    const n = X.length;
    const m = X[0].length;
    // Ridge regression parameter
    const lambda = 0.01;

    // Compute X^T * X + lambda * I
    const XtX = Array(m).fill(0).map(() => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) sum += X[k][i] * X[k][j];
            XtX[i][j] = sum + (i === j ? lambda : 0);
        }
    }

    // Compute X^T * y
    const Xty = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) sum += X[k][i] * y[k];
        Xty[i] = sum;
    }

    return gaussianEliminationPivot(XtX, Xty);
};
