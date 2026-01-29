import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bake, Product } from '../types';

const KEYS = {
    BAKES: 'bakery_bakes',
    PRODUCTS: 'bakery_products',
    LANGUAGE: 'bakery_language'
};

export const saveBakes = async (bakes: Bake[]) => {
    try {
        await AsyncStorage.setItem(KEYS.BAKES, JSON.stringify(bakes));
    } catch (e) {
        console.error('Failed to save bakes', e);
    }
};

export const loadBakes = async (): Promise<Bake[]> => {
    try {
        const json = await AsyncStorage.getItem(KEYS.BAKES);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load bakes', e);
        return [];
    }
};

export const saveProducts = async (products: Product[]) => {
    try {
        await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
        console.error('Failed to save products', e);
    }
};

export const loadProducts = async (): Promise<Product[]> => {
    try {
        const json = await AsyncStorage.getItem(KEYS.PRODUCTS);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load products', e);
        return [];
    }
};
