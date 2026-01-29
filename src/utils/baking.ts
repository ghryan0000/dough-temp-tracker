import { Bake, RegressionModel } from '../types';

export const calculateSimpleFriction = (bake: Bake): string => {
    const { roomTemp, flourTemp, waterTemp, levainTemp, finalTemp } = bake;
    // Check if any value is empty string (ignoring 0)
    if (roomTemp === '' || flourTemp === '' || waterTemp === '' || levainTemp === '' || finalTemp === '') return '-';

    return ((5 * Number(finalTemp)) - (Number(roomTemp) + Number(flourTemp) + Number(waterTemp) + Number(levainTemp))).toFixed(1);
};

export const predictWaterTemp = (
    model: RegressionModel | null,
    roomTemp: number | string,
    flourTemp: number | string,
    levainTemp: number | string,
    targetFinal: number | string,
    mixTime: number | string,
    hydration: number | string
): number | null => {
    if (!model) return null;

    return (model.intercept || 0) +
        (model.roomCoef || 0) * Number(roomTemp) +
        (model.flourCoef || 0) * Number(flourTemp) +
        (model.levainCoef || 0) * Number(levainTemp) +
        (model.targetCoef || 0) * Number(targetFinal) +
        (model.mixTimeCoef || 0) * Number(mixTime) +
        (model.hydrationCoef || 0) * Number(hydration);
};
