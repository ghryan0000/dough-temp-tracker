import { useMemo } from 'react';
import { Bake, RegressionModel } from '../types';
import { solveRobust } from '../utils/math';

export function useRegressionModel(bakes: Bake[], selectedProductId: number): RegressionModel {
    return useMemo(() => {
        const validBakes = bakes.filter(b =>
            b.productId === selectedProductId &&
            b.roomTemp !== '' && b.flourTemp !== '' && b.waterTemp !== '' &&
            b.levainTemp !== '' && b.finalTemp !== '' && b.mixTime !== '' && b.hydration !== ''
        );

        const n = validBakes.length;

        // Calculate average friction as fallback
        let avgFriction = 30;
        if (n > 0) {
            const frictions = validBakes.map(b => {
                const val = (5 * Number(b.finalTemp)) - (Number(b.roomTemp) + Number(b.flourTemp) + Number(b.waterTemp) + Number(b.levainTemp));
                return isNaN(val) ? 30 : val;
            });
            avgFriction = frictions.reduce((a, b) => a + b, 0) / n;
        }

        const baseInfo: RegressionModel = {
            ready: true, // Always ready to show equation
            isSynthetic: true, // Flag for UI to know it's not real MLR yet
            nSamples: n,
            avgFriction,
            rSquared: 0,
            intercept: -avgFriction, // Simple method: Water = (5*Target) - Room - Flour - Levain - Friction
            roomCoef: -1,
            flourCoef: -1,
            levainCoef: -1,
            targetCoef: 5,
            mixTimeCoef: 0,
            hydrationCoef: 0
        };

        if (n < 3) return baseInfo;

        try {
            const y = validBakes.map(b => parseFloat(b.waterTemp as string));
            const rawX = validBakes.map(b => [
                1, parseFloat(b.roomTemp as string), parseFloat(b.flourTemp as string), parseFloat(b.levainTemp as string),
                parseFloat(b.finalTemp as string), parseFloat(b.mixTime as string), parseFloat(b.hydration as string)
            ]);

            const means: number[] = [];
            const stds: number[] = [];
            for (let j = 1; j < 7; j++) {
                const values = rawX.map((row: number[]) => row[j]);
                const mean = values.reduce((a: number, b: number) => a + b, 0) / n;
                const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / n;
                const std = Math.sqrt(variance) || 1;
                means.push(mean);
                stds.push(std);
            }

            const X = rawX.map((row: number[]) => [row[0], ...row.slice(1).map((val: number, idx: number) => (val - means[idx]) / stds[idx])]);
            const beta = solveRobust(X, y);

            if (!beta) return baseInfo;

            const denormBeta = [
                beta[0] - beta.slice(1).reduce((sum, b, i) => sum + b * means[i] / stds[i], 0),
                ...beta.slice(1).map((b, i) => b / stds[i])
            ];

            const yMean = y.reduce((a, b) => a + b, 0) / n;
            let ssTotal = 0, ssResidual = 0;
            for (let i = 0; i < n; i++) {
                const predicted = denormBeta[0] + denormBeta[1] * rawX[i][1] + denormBeta[2] * rawX[i][2] +
                    denormBeta[3] * rawX[i][3] + denormBeta[4] * rawX[i][4] + denormBeta[5] * rawX[i][5] + denormBeta[6] * rawX[i][6];
                ssTotal += Math.pow(y[i] - yMean, 2);
                ssResidual += Math.pow(y[i] - predicted, 2);
            }

            const rSquared = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal))) : 0;
            return {
                ready: true,
                intercept: denormBeta[0], roomCoef: denormBeta[1], flourCoef: denormBeta[2],
                levainCoef: denormBeta[3], targetCoef: denormBeta[4], mixTimeCoef: denormBeta[5],
                hydrationCoef: denormBeta[6], rSquared: rSquared, nSamples: n, avgFriction,
                isSynthetic: false
            };
        } catch (error) {
            console.error('Regression failed:', error);
            return baseInfo;
        }
    }, [bakes, selectedProductId]);
}
