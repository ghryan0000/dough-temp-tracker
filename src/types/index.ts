export interface Product {
    id: number;
    name: string;
    color: string;
}

export interface Bake {
    id: number;
    productId: number;
    date: string;
    roomTemp: number | string;
    flourTemp: number | string;
    waterTemp: number | string;
    levainTemp: number | string;
    finalTemp: number | string;
    mixTime: number | string;
    hydration: number | string;
}

export interface ProductCount {
    id: number;
    name: string;
    count: number;
}

export interface RegressionModel {
    intercept: number;
    roomCoef: number;
    flourCoef: number;
    levainCoef: number;
    targetCoef: number;
    mixTimeCoef: number;
    hydrationCoef: number;
    rSquared: number;
    nSamples: number;
    avgFriction?: number; // Added optional as it was used in calculation but maybe not in interface originally
    // Based on code:
    // avgFriction IS used in the object returned by useMemo
    // isSynthetic IS used in the object returned by useMemo
    // ready IS used in the object returned by useMemo
    // Let's add them to be safe and accurate to the implementation
    isSynthetic?: boolean;
    ready?: boolean;
}

// Extend Window for WebkitAudioContext
export interface WindowWithWebkit extends Window {
    webkitAudioContext: typeof AudioContext;
}

export type Language = 'en' | 'zh' | 'ja';
