import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { Plus, Trash2, Download, TrendingUp, AlertCircle, Calculator, ChefHat, Package, Search, ChevronRight, BarChart3, Wind, Activity, Pencil, Check, ChevronDown, ChevronUp, ArrowUp, ArrowDown, X, Calendar } from 'lucide-react';


// Interfaces
interface Product {
  id: number;
  name: string;
  color: string;
}

interface Bake {
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

interface ProductCount {
  id: number;
  name: string;
  count: number;
}

interface RegressionModel {
  intercept: number;
  roomCoef: number;
  flourCoef: number;
  levainCoef: number;
  targetCoef: number;
  mixTimeCoef: number;
  hydrationCoef: number;
  rSquared: number;
  nSamples: number;
}

// Extend Window for WebkitAudioContext
interface WindowWithWebkit extends Window {
  webkitAudioContext: typeof AudioContext;
}

// Product colors for dynamic assignment
const PRODUCT_COLORS: string[] = ['bg-amber-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500'];

// Translations
const TRANSLATIONS = {
  en: {
    appTitle: "Ryan's Bakery",
    appSubtitle: "Water Temperature Tracker",
    appDescription: "\"Perfect Water Temp, Predictable Final Dough.\"",
    modelReady: "Model Ready",
    selectProduct: "Select Product",
    scrollToSelect: "Scroll to select",
    calculatorTitle: "Calculate Water Temp",
    enterData: "Enter variables",
    targetWaterTemp: "Suggested Water Temp for Mixing.",
    calculateButton: "Calculate Water Temp",
    historyTitle: "MLR Training History",
    historyList: "Recorded Sessions",
    entries: "Entries",
    noData: "No training data yet.",
    addBakesHint: "Add previous bakes to train the model.",
    yourProducts: "Your Products",
    friction: "Friction",
    date: "Date",
    // Field Labels
    room: "Room Temp",
    flour: "Flour Temp",
    levain: "Levain Temp",
    target: "Target FD Temp",
    mix: "Mix Time", // Expanded for clarity in calc
    hydration: "Hydration (water/flour)",
    water: "Actual Water Temp",
    final: "FD Temp",
    mixShort: "Mix", // For table headers
    hydrShort: "Hydr %",
    mlrTraining: "MLR Training",
    sessions: "Total Session",
    model: "Model",
    coefficients: "Coefficients",
    frictionPerMin: "Friction/min",
    hydrationPercent: "Hydration/%",
    quality: "Quality",
    fit: "Fit",
    // Documentation
    aboutTitle: "User Guide",
    aboutContent: "Ryan's Bakery Water Temperature Tracker ensures consistent dough by calculating the precise water temperature needed. It uses Multiple Linear Regression (MLR) to learn from your past baking sessions, adapting to your specific environment and ingredients.",
    howToUseTitle: "How to Use",
    step1Title: "Select Product",
    step1Content: "Scroll the wheel to select a dough type.",
    step2Title: "Calculate Temp",
    step2Content: "Enter current conditions (Room, Flour, etc.) to get the Target Water Temp.",
    step3Title: "Record Session",
    step3Content: "After mixing, use 'Add Practical session Data' to log the actual results to train the MLR model.",
    step4Title: "Export Data",
    step4Content: "Download your baking history as a CSV file.",
    step5Title: "Manage Products",
    step5Content: "Add, rename, reorder, or delete products below.",
    // MLR Logic
    mlrLogicTitle: "MLR Logic",
    mlrStep1Title: "Data Collection & 'Waiting' State",
    mlrStep1Content: "The app needs data to start. For a new product, you'll see a 'Waiting...' status until your first bake is recorded.",
    mlrStep2Title: "Standard Formula (Learning Phase)",
    mlrStep2Content: "With 1-2 sessions, the status is 'Standard Formula (Learning: X/3)'. The app uses a base formula while calculating your unique average Friction.",
    mlrStep3Title: "MLR Trained! (Pattern Recognition)",
    mlrStep3Content: "With 3+ sessions, 'MLR Trained!' activates. Multiple Linear Regression is used to analyze how variables like Mix Time or Hydration subtly impact heat.",
    mlrStep4Title: "Fit Reliability Score",
    mlrStep4Content: "Check your R² score: EXCELLENT (≥0.9), GOOD (≥0.7), or LEARNING (<0.7). This tells you how accurately the model matches your specific kitchen's environment.",
  },
  zh: {
    appTitle: "Ryan's Bakery",
    appSubtitle: "水溫追蹤器",
    appDescription: "計算最佳水溫，確保麵團品質穩定一致。",
    modelReady: "模型就緒",
    selectProduct: "選擇產品",
    scrollToSelect: "滾動選擇",
    calculatorTitle: "計算水溫",
    enterData: "輸入變數",
    targetWaterTemp: "目標水溫",
    calculateButton: "計算水溫",
    historyTitle: "MLR 訓練歷史",
    historyList: "已紀錄場次",
    entries: "條紀錄",
    noData: "暫無訓練數據",
    addBakesHint: "添加過往烘焙紀錄以訓練模型",
    yourProducts: "您的產品",
    friction: "摩擦升溫",
    date: "日期",
    room: "室溫 (Room Temp)",
    flour: "粉溫 (Flour Temp)",
    levain: "酵種溫 (Levain Temp)",
    target: "目標 FD Temp (Target FD Temp)",
    mix: "攪拌時間 (Mix Time)",
    hydration: "含水量 Hydration (water/flour)",
    water: "實際水溫 (Actual Water Temp)",
    final: "麵團終溫 (FD Temp)",
    mixShort: "攪拌",
    hydrShort: "含水%",
    mlrTraining: "MLR 訓練",
    sessions: "總場次",
    model: "模型",
    coefficients: "係數",
    frictionPerMin: "摩擦升溫/分",
    hydrationPercent: "含水量/%",
    quality: "品質",
    fit: "擬合度",
    // Documentation
    aboutTitle: "使用指南",
    aboutContent: "Ryan 的烘焙坊水溫追蹤器通過計算理想水溫，助您製作出品質穩定的麵團。應用利用多元線性回歸 (MLR) 從您的烘焙紀錄中學習，根據環境條件預測最佳水溫。",
    howToUseTitle: "使用說明",
    step1Title: "選擇產品",
    step1Content: "滾動轉輪以選擇麵團類型。",
    step2Title: "計算水溫",
    step2Content: "輸入當前條件（室溫、粉溫等）以獲取目標水溫。",
    step3Title: "紀錄場次",
    step3Content: "攪拌後，點擊「添加場次」紀錄實際結果，以訓練 MLR 模型。",
    step4Title: "匯出數據",
    step4Content: "將您的烘焙歷史下載為 CSV 文件。",
    step5Title: "管理產品",
    step5Content: "在下方添加、重命名、排序或刪除產品。",
    // MLR Logic
    mlrLogicTitle: "MLR 邏輯",
    mlrStep1Title: "數據收集與「等待」狀態",
    mlrStep1Content: "模型需要數據才能運作。對於新產品，在紀錄第一場烘焙前，您會看到「Waiting...」狀態。",
    mlrStep2Title: "標準公式（學習階段）",
    mlrStep2Content: "累積 1-2 場時，狀態為「Standard Formula (Learning: X/3)」。應用會使用基礎公式，並計算您獨特的平均摩擦係數。",
    mlrStep3Title: "MLR 訓練完畢（模式識別）",
    mlrStep3Content: "累積 3 場後，狀態變為「MLR Trained!」。多元線性回歸模型啟動，分析攪拌時間或含水量如何微妙地影響麵團升溫。",
    mlrStep4Title: "擬合可靠度評價",
    mlrStep4Content: "檢查您的 R² 分數得分：EXCELLENT (≥0.9)、GOOD (≥0.7) 或 LEARNING (<0.7)。這反映了模型對您廚房環境預測的精準程度。",
  },
  ja: {
    appTitle: "ライアンのベーカリー",
    appSubtitle: "水温トラッカー",
    appDescription: "最適な水温を計算し、安定した生地品質を実現します。",
    modelReady: "モデル準備完了",
    selectProduct: "製品を選択",
    scrollToSelect: "スクロールして選択",
    calculatorTitle: "水温を計算",
    enterData: "変数を入力",
    targetWaterTemp: "目標水温",
    calculateButton: "水温を計算",
    historyTitle: "MLR 学習履歴",
    historyList: "記録されたセッション",
    entries: "件",
    noData: "データがありません",
    addBakesHint: "過去のデータを追加してモデルを学習",
    yourProducts: "製品一覧",
    friction: "摩擦熱",
    date: "日付",
    room: "室温 (Room Temp)",
    flour: "粉温 (Flour Temp)",
    levain: "種温 (Levain Temp)",
    target: "目標 FD Temp (Target FD Temp)",
    mix: "ミキシング (Mix Time)",
    hydration: "加水率 Hydration (water/flour)",
    water: "實際水温 (Actual Water Temp)",
    final: "生地終温 (FD Temp)",
    mixShort: "ミキシング",
    hydrShort: "加水%",
    mlrTraining: "MLR 学習",
    sessions: "総セッション",
    model: "モデル",
    coefficients: "係数",
    frictionPerMin: "摩擦/分",
    hydrationPercent: "加水率/%",
    quality: "品質",
    fit: "適合度",
    // Documentation
    aboutTitle: "ユーザーガイド",
    aboutContent: "Ryan's Bakery 水温トラッカーは、理想的な水温を計算し、安定した生地作りをサポートします。重回歸分析 (MLR) を用いて過去のデータから学習し、環境に応じた最適な水温を予測します。",
    howToUseTitle: "使い方",
    step1Title: "製品を選択",
    step1Content: "ホイールをスクロールして生地タイプを選択します。",
    step2Title: "水温を計算",
    step2Content: "現在の条件（室温、粉温など）を入力し、目標水温を取得します。",
    step3Title: "セッションを記録",
    step3Content: "ミキシング後、「セッションを追加」で結果を記録し、MLRモデルを学習させます。",
    step4Title: "データをエクスポート",
    step4Content: "履歴をCSVファイルとしてダウンロードできます。",
    step5Title: "製品を管理",
    step5Content: "製品の追加、名前変更、並べ替え、削除が可能です。",
    // MLR Logic
    mlrLogicTitle: "MLR ロジック",
    mlrStep1Title: "データ収集と待機状態",
    mlrStep1Content: "モデルにはデータが必要です。新しい製品の場合、最初の記録が行われるまで「Waiting...」と表示されます。",
    mlrStep2Title: "標準式（学習フェーズ）",
    mlrStep2Content: "1〜2回の記録では「Standard Formula (Learning: X/3)」となります。独自平均摩擦熱を算出しつつ、標準的な計算式を使用します。",
    mlrStep3Title: "MLR 学習完了（パターン認識）",
    mlrStep3Content: "3回以上の記録で「MLR Trained!」が起動します。ミキシング時間や加水率などの変数が温度に与える隠れたパターンを重回帰分析で導き出します。",
    mlrStep4Title: "適合信頼度スコア",
    mlrStep4Content: "R²スコアを確認してください：EXCELLENT (≥0.9), GOOD (≥0.7), または LEARNING (<0.7)。モデルがあなたのキッチン環境をどれだけ正確に捉えているかを示します。",
  }
};

type Language = 'en' | 'zh' | 'ja';
type Translation = typeof TRANSLATIONS.en;

// Utility functions outside the component
const calculateSimpleFriction = (bake: Bake): string => {
  const { roomTemp, flourTemp, waterTemp, levainTemp, finalTemp } = bake;
  if (roomTemp === '' || flourTemp === '' || waterTemp === '' || levainTemp === '' || finalTemp === '') return '-';
  return ((5 * Number(finalTemp)) - (Number(roomTemp) + Number(flourTemp) + Number(waterTemp) + Number(levainTemp))).toFixed(1);
};

const solveRobust = (X: number[][], y: number[]): number[] | null => {
  const n = X.length, m = X[0].length, lambda = 0.01;
  const XtX = Array(m).fill(0).map(() => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += X[k][i] * X[k][j];
      XtX[i][j] = sum + (i === j ? lambda : 0);
    }
  }
  const Xty = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) sum += X[k][i] * y[k];
    Xty[i] = sum;
  }
  return gaussianEliminationPivot(XtX, Xty);
};

const gaussianEliminationPivot = (A: number[][], b: number[]): number[] | null => {
  const n = A.length;
  const Ab = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) maxRow = k;
    }
    [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];
    if (Math.abs(Ab[i][i]) < 1e-12) return null;
    for (let k = i + 1; k < n; k++) {
      const factor = Ab[k][i] / Ab[i][i];
      for (let j = i; j <= n; j++) Ab[k][j] -= factor * Ab[i][j];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = Ab[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= Ab[i][j] * x[j];
    x[i] /= Ab[i][i];
    if (!isFinite(x[i])) return null;
  }
  return x;
};

export default function DoughTempTracker() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const t = TRANSLATIONS[language];

  // Data migration and initialization
  const [products, setProducts] = useState<Product[]>(() => {
    // Check for new format first
    const newFormat = localStorage.getItem('products-v2');
    if (newFormat) {
      return JSON.parse(newFormat);
    }

    // Migrate from old format
    const oldFormat = localStorage.getItem('productNames');
    if (oldFormat) {
      const productNames = JSON.parse(oldFormat) as string[];
      const migratedProducts = productNames.map((name, index) => ({
        id: index + 1,
        name: name,
        color: PRODUCT_COLORS[index % PRODUCT_COLORS.length]
      }));
      localStorage.setItem('products-v2', JSON.stringify(migratedProducts));
      return migratedProducts;
    }

    // Default products
    return [
      { id: 1, name: 'Sourdough', color: 'bg-amber-500' },
      { id: 2, name: 'Baguette', color: 'bg-orange-500' },
      { id: 3, name: 'Croissant', color: 'bg-red-500' },
      { id: 4, name: 'Pizza Dough', color: 'bg-pink-500' },
      { id: 5, name: 'Challah', color: 'bg-purple-500' },
      { id: 6, name: 'Focaccia', color: 'bg-indigo-500' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('products-v2', JSON.stringify(products));
  }, [products]);

  const [selectedProductId, setSelectedProductId] = useState<number>(() => {
    const saved = localStorage.getItem('selectedProductId-v2');
    if (saved) return parseInt(saved);

    // Migrate from old format
    const oldProduct = localStorage.getItem('currentProduct');
    if (oldProduct && products.length > 0) {
      const found = products.find(p => p.name === oldProduct);
      return found ? found.id : products[0].id;
    }
    return products[0]?.id || 1;
  });

  useEffect(() => {
    localStorage.setItem('selectedProductId-v2', selectedProductId.toString());
  }, [selectedProductId]);




  const [targetTemp, setTargetTemp] = useState<number | string>(25);
  const [bakes, setBakes] = useState<Bake[]>(() => {
    // Check for new format first
    const newFormat = localStorage.getItem('bakes-v2');
    if (newFormat) {
      return JSON.parse(newFormat);
    }

    // Migrate from old format
    const oldFormat = localStorage.getItem('bakesData');
    if (oldFormat) {
      const oldBakes = JSON.parse(oldFormat) as Array<{ productType: string;[key: string]: any }>;
      const migratedBakes = oldBakes.map(bake => {
        const product = products.find(p => p.name === bake.productType);
        const { productType, ...rest } = bake;
        return { ...rest, productId: product ? product.id : 1 } as unknown as Bake;
      });
      localStorage.setItem('bakes-v2', JSON.stringify(migratedBakes));
      return migratedBakes;
    }

    // Default bakes
    return [
      { id: 1, productId: 1, date: '2026-01-15', roomTemp: 22, flourTemp: 20, waterTemp: 30, levainTemp: 24, finalTemp: 25, mixTime: 5, hydration: 70 },
      { id: 2, productId: 1, date: '2026-01-16', roomTemp: 23, flourTemp: 21, waterTemp: 28, levainTemp: 25, finalTemp: 24.5, mixTime: 6, hydration: 75 },
      { id: 3, productId: 1, date: '2026-01-17', roomTemp: 21, flourTemp: 19, waterTemp: 32, levainTemp: 23, finalTemp: 25, mixTime: 5, hydration: 70 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('bakes-v2', JSON.stringify(bakes));
  }, [bakes]);

  // Auto-load last session figures
  useEffect(() => {
    // Find latest bake for this product
    const productBakes = bakes.filter(b => b.productId === selectedProductId);
    // Sort by ID descending (newest first)
    const lastBake = [...productBakes].sort((a, b) => b.id - a.id)[0];

    if (lastBake) {
      setCurrentConditions({
        roomTemp: lastBake.roomTemp,
        flourTemp: lastBake.flourTemp,
        levainTemp: lastBake.levainTemp,
        mixTime: lastBake.mixTime,
        hydration: lastBake.hydration
      });
    } else {
      // Default fallbacks for new product
      setCurrentConditions({
        roomTemp: 22,
        flourTemp: 20,
        levainTemp: 24,
        mixTime: 5,
        hydration: 70
      });
    }
  }, [selectedProductId, bakes]);

  const [newBakeData, setNewBakeData] = useState({
    date: new Date().toISOString().split('T')[0],
    roomTemp: '',
    flourTemp: '',
    waterTemp: '',
    levainTemp: '',
    finalTemp: '',
    mixTime: '',
    hydration: ''
  });

  // Product management
  const [showProductManager, setShowProductManager] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const addProduct = () => {
    if (!newProductName.trim()) return;
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
      id: newId,
      name: newProductName.trim(),
      color: PRODUCT_COLORS[products.length % PRODUCT_COLORS.length]
    };
    setProducts([...products, newProduct]);
    setNewProductName('');
  };

  const deleteProduct = (id: number) => {
    if (products.length === 1) {
      alert('Cannot delete the last product!');
      return;
    }
    setProducts(products.filter(p => p.id !== id));
    setBakes(bakes.filter(b => b.productId !== id));
    if (selectedProductId === id) {
      setSelectedProductId(products.filter(p => p.id !== id)[0].id);
    }
  };

  const handleRenameProduct = (id: number, newName: string) => {
    if (!newName.trim()) return;
    const product = products.find(p => p.id === id);
    if (!product || product.name === newName) return;

    setProducts(products.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newProducts.length) {
      [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
      setProducts(newProducts);
    }
  };

  const [currentConditions, setCurrentConditions] = useState<Record<string, string | number>>({
    roomTemp: 22,
    flourTemp: 20,
    levainTemp: 24,
    mixTime: 5,
    hydration: 70
  });

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showMLRGuide, setShowMLRGuide] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const regressionModel = useMemo(() => {
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

    const baseInfo = {
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

  useEffect(() => {
    if (regressionModel) {
      if (regressionModel.isSynthetic) {
        setDebugInfo(`Standard Formula (Learning: ${regressionModel.nSamples}/3)`);
      } else {
        setDebugInfo(`MLR Trained! R²=${regressionModel.rSquared.toFixed(3)}`);
      }
    }
  }, [regressionModel]);

  const solveRobust = (X: number[][], y: number[]) => {
    const n = X.length, m = X[0].length, lambda = 0.01;
    const XtX = Array(m).fill(0).map(() => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) sum += X[k][i] * X[k][j];
        XtX[i][j] = sum + (i === j ? lambda : 0);
      }
    }
    const Xty = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += X[k][i] * y[k];
      Xty[i] = sum;
    }
    return gaussianEliminationPivot(XtX, Xty);
  };

  const gaussianEliminationPivot = (A: number[][], b: number[]) => {
    const n = A.length;
    const Ab = A.map((row, i) => [...row, b[i]]);
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) maxRow = k;
      }
      [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];
      if (Math.abs(Ab[i][i]) < 1e-12) return null;
      for (let k = i + 1; k < n; k++) {
        const factor = Ab[k][i] / Ab[i][i];
        for (let j = i; j <= n; j++) Ab[k][j] -= factor * Ab[i][j];
      }
    }
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = Ab[i][n];
      for (let j = i + 1; j < n; j++) x[i] -= Ab[i][j] * x[j];
      x[i] /= Ab[i][i];
      if (!isFinite(x[i])) return null;
    }
    return x;
  };

  // Removed manual regression trigger useEffect

  const addBake = () => {
    // Only add if all fields are completed
    const isFormComplete =
      newBakeData.roomTemp &&
      newBakeData.flourTemp &&
      newBakeData.levainTemp &&
      newBakeData.waterTemp &&
      newBakeData.finalTemp &&
      newBakeData.mixTime &&
      newBakeData.hydration;

    if (!isFormComplete) return;

    const newId = bakes.length > 0 ? Math.max(...bakes.map(b => b.id)) + 1 : 1;
    setBakes([...bakes, {
      ...newBakeData,
      id: newId,
      productId: selectedProductId
    } as Bake]);

    // Reset fields
    setNewBakeData({
      date: new Date().toISOString().split('T')[0],
      roomTemp: '',
      flourTemp: '',
      waterTemp: '',
      levainTemp: '',
      finalTemp: '',
      mixTime: '',
      hydration: ''
    });
  };

  const deleteBake = (id: number) => setBakes(bakes.filter(b => b.id !== id));
  const updateBake = (id: number, field: keyof Bake, value: string | number) => setBakes(bakes.map(b => b.id === id ? { ...b, [field]: value } : b));
  const updateCurrentCondition = (field: string, value: string | number) => setCurrentConditions({ ...currentConditions, [field]: value });

  // Prediciton logic stays near calculator
  const predictWaterTemp = (roomTemp: number | string, flourTemp: number | string, levainTemp: number | string, targetFinal: number | string, mixTime: number | string, hydration: number | string) => {
    if (!regressionModel) return null;

    // Unified Prediction Logic: Always use coefficients
    // If n < 3, these will be the Synthetic "Simple Method" coeffs (-1, -1, -1, 5, -avgFriction)
    // If n >= 3, these will be the MLR Learned coeffs
    return (regressionModel.intercept || 0) +
      (regressionModel.roomCoef || 0) * Number(roomTemp) +
      (regressionModel.flourCoef || 0) * Number(flourTemp) +
      (regressionModel.levainCoef || 0) * Number(levainTemp) +
      (regressionModel.targetCoef || 0) * Number(targetFinal) +
      (regressionModel.mixTimeCoef || 0) * Number(mixTime) +
      (regressionModel.hydrationCoef || 0) * Number(hydration);
  };

  const currentPredictedWater = useMemo(() => predictWaterTemp(
    currentConditions.roomTemp, currentConditions.flourTemp, currentConditions.levainTemp,
    targetTemp, currentConditions.mixTime, currentConditions.hydration
  ), [regressionModel, currentConditions, targetTemp]);

  const currentProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
  const currentBakes = useMemo(() => bakes.filter(b => b.productId === selectedProductId), [bakes, selectedProductId]);
  const memoizedSortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);

  const exportCSV = () => {
    const product = products.find(p => p.id === selectedProductId);
    const productBakes = bakes.filter(b => b.productId === selectedProductId);
    const headers = ['Date', 'Product', 'Room', 'Flour', 'Actual Water Temp', 'Levain', 'FD Temp', 'Mix', 'Hydration', 'Friction'];
    const rows = productBakes.map(b => [b.date, product?.name, b.roomTemp, b.flourTemp, b.waterTemp, b.levainTemp, b.finalTemp, b.mixTime, b.hydration, calculateSimpleFriction(b)]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product?.name.replace(/\s+/g, '_')}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-apple-bg pt-4 md:pt-6 pb-20 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header - Compact */}
        <div className="flex items-end justify-between mb-2 md:mb-4 -mx-4 px-4 py-2 bg-gradient-to-r from-apple-red/90 to-red-600/90 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold font-serif italic text-white tracking-tight">{t.appTitle}</h1>
            <p className="text-red-50/90 text-xs font-medium">{t.appSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { code: 'en', label: 'EN' },
              { code: 'zh', label: '繁' },
              { code: 'ja', label: '日' }
            ].map((langOption) => (
              <button
                key={langOption.code}
                onClick={() => setLanguage(langOption.code as Language)}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${language === langOption.code
                  ? 'bg-white text-apple-red shadow-sm'
                  : 'text-red-100 hover:text-white hover:bg-white/20'
                  }`}
                aria-label={`Switch to ${langOption.label}`}
              >
                {langOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* App Description - One Liner */}
        <p className="text-[13px] font-bold italic text-apple-red mb-6 -mt-2 px-1 leading-relaxed max-w-[390px]">
          {t.appDescription}
        </p>

        {/* Main Content Grid: Product Selector (Jukebox) | Calculator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8 items-start">

          {/* Left Column: Product Selector (Card Grid) */}
          <div className="md:col-span-4 flex flex-col w-full">
            <div className="flex items-start gap-2 mb-4 px-1">
              <Package size={18} className="text-apple-red mt-1" />
              <div className="flex flex-row items-baseline gap-2">
                <h2 className="text-lg font-bold text-black leading-tight">{t.selectProduct}</h2>
                <p className="text-xs text-apple-gray font-medium">{t.scrollToSelect}</p>
              </div>
            </div>
            <ProductWheelSelector
              products={memoizedSortedProducts}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
            />
          </div>

          {/* Right Column: Calculator */}
          <div className="md:col-span-8 flex flex-col">
            <div className="flex items-start gap-2 mb-4 px-1">
              <Calculator size={18} className="text-apple-red mt-1" />
              <div className="flex flex-row items-baseline gap-2">
                <h2 className="text-lg font-bold text-black leading-tight">{t.calculatorTitle}</h2>
                <p className="text-xs text-apple-gray font-medium">{t.enterData}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-red-50 p-2.5 md:p-5 relative overflow-hidden w-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-apple-red/5 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

              {/* Target Display */}
              <div className={`py-2 px-3 md:py-4 md:px-6 rounded-2xl mb-6 md:mb-10 border transition-all duration-500 relative overflow-hidden ${regressionModel ? 'bg-gradient-to-br from-red-100 to-red-50 border-apple-red/20 shadow-inner' : 'bg-gray-100 border-transparent'}`}>
                <div className="text-[10px] font-extrabold text-apple-gray uppercase tracking-wider text-left mb-4 animate-pulse">{t.targetWaterTemp}</div>
                <div className={`text-4xl md:text-7xl font-black tracking-tighter leading-none text-center animate-pulse ${currentPredictedWater ? 'text-apple-red' : 'text-gray-300'}`}>
                  {currentPredictedWater !== null ? currentPredictedWater.toFixed(1) : '--'}
                  <span className="text-xl md:text-3xl ml-1 font-medium text-gray-400">°C</span>
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {[
                  { label: t.target, key: 'target', unit: '°C' },
                  { label: t.room, key: 'roomTemp', unit: '°C' },
                  { label: t.flour, key: 'flourTemp', unit: '°C' },
                  { label: t.levain, key: 'levainTemp', unit: '°C' },
                  { label: t.mix, key: 'mixTime', unit: 'min' },
                  { label: t.hydration, key: 'hydration', unit: '%' }
                ].map((field) => (
                  <CalculatorInput
                    key={field.key}
                    label={field.label}
                    unit={field.unit}
                    value={field.key === 'target' ? targetTemp : currentConditions[field.key]}
                    onChange={(val) => field.key === 'target' ? setTargetTemp(val) : updateCurrentCondition(field.key, val)}
                    highlight={field.key === 'target'}
                  />
                ))}
              </div>

              {/* Result Display */}
              {/* This section was replaced by the new Target Display and Input Grid above */}
              {/*
            <div className={`p-2 rounded-xl text-center transition-all ${regressionModel ? 'bg-red-100 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <div className="text-[10px] font-bold text-apple-gray tracking-wider">Suggested Water Temp for Mixing.</div>
                {regressionModel && (
                  <span className="text-[9px] font-bold px-1.5 py-px bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-0.5">
                    <Activity size={8} /> Model Ready
                  </span>
                )}
              </div>
              <div className={`text-3xl font-black tracking-tighter ${currentPredictedWater ? 'text-apple-red' : 'text-gray-300'}`}>
                {currentPredictedWater !== null ? currentPredictedWater.toFixed(1) : '--'}
                <span className="text-sm ml-0.5 font-medium text-gray-400">°C</span>
              </div>
            </div>
            */}

              {/* MLR Training Result - Claude AI Style Integration */}
              <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Activity size={18} className="text-green-600" />
                  Training Status: {currentProduct?.name}
                </h3>

                <div className={`mb-4 p-3 rounded-lg border ${regressionModel?.ready ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-sm">
                    <strong className="text-gray-900">Status:</strong> <span className={regressionModel?.isSynthetic ? 'text-green-600' : 'text-gray-700'}>
                      {regressionModel?.isSynthetic ? 'Standard Formula' : 'MLR Trained!'}
                      <span className="text-green-600 font-mono text-xs ml-1">
                        {regressionModel?.isSynthetic
                          ? `(Learning: ${regressionModel.nSamples}/3)`
                          : `(R²=${regressionModel.rSquared.toFixed(3)})`}
                      </span>
                    </span><br />
                    <strong className="text-gray-900">Fit Reliability:</strong> <span className={`uppercase ml-1 ${!regressionModel?.ready || regressionModel.rSquared < 0.7 ? 'text-green-600' : regressionModel.rSquared >= 0.9 ? 'text-green-600' : 'text-amber-500'}`}>
                      {!regressionModel?.ready ? 'Learning' : regressionModel.rSquared >= 0.9 ? 'Excellent' : regressionModel.rSquared >= 0.7 ? 'Good' : 'Learning'}
                    </span>
                    <span className="text-green-600 font-mono text-xs ml-1">({(regressionModel.rSquared || 0).toFixed(3)})</span>
                  </div>
                </div>

                {regressionModel && (
                  <div>
                    <button
                      onClick={() => setShowAnalysis(!showAnalysis)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      {showAnalysis ? 'Hide' : 'Show'} Details
                      <ChevronDown className={`ml-1 transform transition-transform ${showAnalysis ? 'rotate-180' : ''}`} size={14} />
                    </button>

                    {showAnalysis && (
                      <div className="mt-4 bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden text-gray-800">
                        {/* Header */}
                        <div className="bg-green-50/50 px-4 py-3 border-b-2 border-gray-100 flex items-center justify-between">
                          <h3 className="font-bold text-sm flex items-center gap-2 text-gray-800 font-mono">
                            <BarChart3 size={16} className="text-green-600" /> {t.model} Analysis
                          </h3>
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Live Engine v1.0</div>
                        </div>

                        <div className="p-4 space-y-5">
                          {/* Equation Block */}
                          <div>
                            <div className="text-[10px] font-bold text-green-700 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              Computed Regression Equation
                            </div>
                            <div className="flex items-center gap-2 mb-3 pl-3 pr-1">
                              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Analysis Confidence</span>
                              <span className="text-[10px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-mono">
                                n = {regressionModel.nSamples} Sessions
                              </span>
                            </div>
                            <div className="text-[13px] leading-relaxed p-3 bg-gray-50/50 rounded-xl border border-gray-100 font-mono">
                              <span className="text-green-700 font-black">Actual Water Temp</span> = {(regressionModel.intercept || 0).toFixed(2)}
                              {(regressionModel.roomCoef || 0) >= 0 ? ' + ' : ' - '}<span className="font-bold text-gray-900">{Math.abs(regressionModel.roomCoef || 0).toFixed(2)}</span> × <span className="text-green-700">{t.room}</span>
                              {(regressionModel.flourCoef || 0) >= 0 ? ' + ' : ' - '}<span className="font-bold text-gray-900">{Math.abs(regressionModel.flourCoef || 0).toFixed(2)}</span> × <span className="text-green-700">{t.flour}</span>
                              {(regressionModel.levainCoef || 0) >= 0 ? ' + ' : ' - '}<span className="font-bold text-gray-900">{Math.abs(regressionModel.levainCoef || 0).toFixed(2)}</span> × <span className="text-green-700">{t.levain}</span>
                              {(regressionModel.targetCoef || 0) >= 0 ? ' + ' : ' - '}<span className="font-bold text-gray-900">{Math.abs(regressionModel.targetCoef || 0).toFixed(2)}</span> × <span className="text-green-700">{t.target}</span>
                              {(regressionModel.mixTimeCoef || 0) >= 0 ? ' + ' : ' - '}<span className="font-bold text-gray-900">{Math.abs(regressionModel.mixTimeCoef || 0).toFixed(2)}</span> × <span className="text-green-700">{t.mix}</span>
                              {(regressionModel.hydrationCoef || 0) >= 0 ? ' + ' : ' - '}<span className="font-bold text-gray-900">{Math.abs(regressionModel.hydrationCoef || 0).toFixed(2)}</span> × <span className="text-green-700">{t.hydration}</span>
                            </div>
                          </div>
                        </div>


                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="px-1">
          <div className="mb-3 flex flex-col items-start gap-2">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              <BarChart3 size={18} className="text-apple-red" /> MLR Training History ({currentProduct?.name})
            </h2>
            <button
              onClick={() => setShowSessionManager(!showSessionManager)}
              className={`${showSessionManager ? 'bg-green-600 hover:bg-green-700' : 'bg-apple-red hover:bg-red-600'} text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm`}
            >
              {showSessionManager ? 'Hide Manager' : 'Show Manager'}
              <ChevronDown className={`ml-1 transform transition-transform ${showSessionManager ? 'rotate-180' : ''}`} size={14} />
            </button>
          </div>

          {showSessionManager && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              {/* Add Session Header */}
              <div className="mb-4 mt-4">
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Add New Session</label>
                  {!(newBakeData.roomTemp && newBakeData.flourTemp && newBakeData.levainTemp && newBakeData.waterTemp && newBakeData.finalTemp && newBakeData.mixTime && newBakeData.hydration) && (
                    <span className="text-[10px] font-bold text-red-500 animate-pulse flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      <AlertCircle size={10} /> Fill all fields to save
                    </span>
                  )}
                </div>

                <div className="bg-gray-50/50 border-2 border-gray-300 rounded-2xl p-3 shadow-sm">
                  <div className="grid grid-cols-4 gap-x-2 gap-y-4 items-end">
                    {/* Row 1: Date (Aligned to span 2 columns) */}
                    <div className="col-span-2">
                      <label className="text-[9px] text-gray-400 block mb-1 font-bold uppercase tracking-tight">Date</label>
                      <div className="relative h-[40px]">
                        <input
                          type="date"
                          aria-label="New Session Date"
                          value={newBakeData.date}
                          onChange={(e) => setNewBakeData({ ...newBakeData, date: e.target.value })}
                          className="w-full h-full text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-2 focus:ring-apple-red/20 transition-all text-center"
                        />
                      </div>
                    </div>
                    <div className="col-span-2" /> {/* Empty spacing for Row 1 */}

                    {/* Row 2: Room, Flour, Levain, Water */}
                    {[
                      { label: t.room, key: 'roomTemp' },
                      { label: t.flour, key: 'flourTemp' },
                      { label: t.levain, key: 'levainTemp' },
                      { label: t.water, key: 'waterTemp' },
                    ].map((field) => (
                      <div key={field.key} className="col-span-1 text-center">
                        <label className={`${field.key === 'waterTemp' ? 'text-[5px]' : 'text-[8px]'} text-gray-400 block mb-0.5 font-bold uppercase tracking-tight truncate`}>{field.label}</label>
                        <input
                          type="number"
                          placeholder="--"
                          className="w-full text-center text-sm font-bold bg-white border border-gray-200 rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-apple-red/20"
                          value={newBakeData[field.key as keyof typeof newBakeData]}
                          onChange={(e) => setNewBakeData({ ...newBakeData, [field.key]: e.target.value })}
                        />
                      </div>
                    ))}

                    {/* Row 3: Final, Mix, Hydr%, Add Button */}
                    {[
                      { label: t.final, key: 'finalTemp' },
                      { label: t.mixShort, key: 'mixTime' },
                      { label: t.hydrShort, key: 'hydration' },
                    ].map((field) => (
                      <div key={field.key} className="col-span-1 text-center">
                        <label className={`${field.key === 'waterTemp' ? 'text-[5px]' : 'text-[8px]'} text-gray-400 block mb-0.5 font-bold uppercase tracking-tight truncate`}>{field.label}</label>
                        <input
                          type="number"
                          placeholder="--"
                          className="w-full text-center text-sm font-bold bg-white border border-gray-200 rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-apple-red/20"
                          value={newBakeData[field.key as keyof typeof newBakeData]}
                          onChange={(e) => setNewBakeData({ ...newBakeData, [field.key]: e.target.value })}
                        />
                      </div>
                    ))}

                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={addBake}
                        disabled={!(newBakeData.roomTemp && newBakeData.flourTemp && newBakeData.levainTemp && newBakeData.waterTemp && newBakeData.finalTemp && newBakeData.mixTime && newBakeData.hydration)}
                        className={`w-full h-[41px] text-white rounded-xl transition-all shadow-md active:scale-90 flex items-center justify-center p-0 ${!(newBakeData.roomTemp && newBakeData.flourTemp && newBakeData.levainTemp && newBakeData.waterTemp && newBakeData.finalTemp && newBakeData.mixTime && newBakeData.hydration)
                          ? 'bg-gray-300 cursor-not-allowed opacity-50'
                          : 'bg-apple-red hover:bg-red-600'
                          }`}
                        title={!(newBakeData.roomTemp && newBakeData.flourTemp && newBakeData.levainTemp && newBakeData.waterTemp && newBakeData.finalTemp && newBakeData.mixTime && newBakeData.hydration) ? "Please fill all fields" : "Add Session to History"}
                      >
                        <Plus size={24} strokeWidth={3.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.historyList}</label>
                  <button onClick={exportCSV} className="text-xs font-medium text-apple-gray hover:text-black flex items-center gap-1 transition-colors pr-1">
                    <Download size={12} /> Export CSV
                  </button>
                </div>
                <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100 border border-gray-100">
                  {currentBakes.length === 0 ? (
                    <div className="p-8 text-center text-apple-gray">
                      <p className="text-sm">No sessions recorded for {currentProduct?.name}</p>
                    </div>
                  ) : (
                    currentBakes.slice().reverse().map((bake: Bake) => (
                      <HistoryRow
                        key={bake.id}
                        bake={bake}
                        t={t}
                        updateBake={updateBake}
                        deleteBake={deleteBake}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Manager Section */}
        <div className="mt-8 px-1">
          <div className="mb-3 flex flex-col items-start gap-2">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              <Package size={18} className="text-purple-600" /> Manage Products
            </h2>
            <button
              onClick={() => setShowProductManager(!showProductManager)}
              className="bg-apple-red hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              {showProductManager ? 'Hide Manager' : 'Show Manager'}
              <ChevronDown className={`ml-1 transform transition-transform ${showProductManager ? 'rotate-180' : ''}`} size={14} />
            </button>
          </div>

          {showProductManager && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              {/* Add Product */}
              <div className="mb-4 mt-4">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Add New Product</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addProduct()}
                    placeholder="e.g., Croissant"
                    className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-300 outline-none"
                  />
                  <button
                    onClick={addProduct}
                    className="px-4 py-2 bg-apple-red text-white rounded-lg hover:bg-red-600 transition-colors"
                    title="Add Product"
                    aria-label="Add Product"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Product List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">{t.yourProducts}</label>
                {products.map((product: Product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-0.5 mr-2">
                        <button
                          onClick={() => moveProduct(products.indexOf(product), 'up')}
                          disabled={products.indexOf(product) === 0}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => moveProduct(products.indexOf(product), 'down')}
                          disabled={products.indexOf(product) === products.length - 1}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-grow">
                        <div className={`w-3 h-3 rounded-full ${product.color} flex-shrink-0`}></div>
                        {editingProductId === product.id ? (
                          <div className="flex items-center gap-1 flex-grow">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                              className="text-sm font-medium border-b border-purple-300 outline-none bg-transparent w-full min-w-0"
                              autoFocus
                              aria-label="Edit Product Name"
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                  handleRenameProduct(product.id, editName);
                                  setEditingProductId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingProductId(null);
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                handleRenameProduct(product.id, editName);
                                setEditingProductId(null);
                              }}
                              className="text-green-600 hover:text-green-700 p-0.5"
                              title="Save"
                              aria-label="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="text-red-500 hover:text-red-600 p-0.5"
                              title="Cancel"
                              aria-label="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-medium truncate">{product.name}</span>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              ({bakes.filter((b: Bake) => b.productId === product.id).length})
                            </span>
                            <button
                              onClick={() => {
                                setEditingProductId(product.id);
                                setEditName(product.name);
                              }}
                              className="text-gray-300 hover:text-purple-600 transition-colors p-1"
                              title="Rename Product"
                            >
                              <Pencil size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={products.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-2"
                      title={products.length === 1 ? "Cannot delete the last product" : "Delete product"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* App Information Footer */}
        <div className="mt-8 px-1">
          <h2 className="text-lg font-bold text-black flex items-center gap-2 mb-3">
            <Activity size={18} className="text-apple-red" /> {t.aboutTitle}
          </h2>

          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {t.aboutContent}
            </p>

            <div>
              <button
                onClick={() => setShowHowToUse(!showHowToUse)}
                className="bg-apple-red hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm mb-3"
              >
                {t.howToUseTitle}
                <ChevronDown className={`ml-1 transform transition-transform ${showHowToUse ? 'rotate-180' : ''}`} size={14} />
              </button>

              {showHowToUse && (
                <div className="space-y-3 text-sm text-gray-600">
                  {[
                    { title: t.step1Title, content: t.step1Content },
                    { title: t.step2Title, content: t.step2Content },
                    { title: t.step3Title, content: t.step3Content },
                    { title: t.step4Title, content: t.step4Content },
                    { title: t.step5Title, content: t.step5Content },
                  ].map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="font-semibold text-apple-red min-w-[20px]">{index + 1}.</span>
                      <div>
                        <strong>{step.title}:</strong> {step.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MLR Logic Section */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <button
                onClick={() => setShowMLRGuide(!showMLRGuide)}
                className="bg-apple-red hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm mb-3"
              >
                {t.mlrLogicTitle}
                <ChevronDown className={`ml-1 transform transition-transform ${showMLRGuide ? 'rotate-180' : ''}`} size={14} />
              </button>

              {showMLRGuide && (
                <div className="bg-white rounded-xl p-4 border border-red-50 shadow-sm animate-fadeIn">
                  <div className="space-y-4">
                    {[
                      { title: t.mlrStep1Title, content: t.mlrStep1Content },
                      { title: t.mlrStep2Title, content: t.mlrStep2Content },
                      { title: t.mlrStep3Title, content: t.mlrStep3Content },
                      { title: t.mlrStep4Title, content: t.mlrStep4Content },
                    ].map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-none w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-apple-red mt-0.5 shadow-sm">
                          {index + 1}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong className="block text-gray-900 mb-0.5">{step.title}</strong>
                          {step.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div >
    </div >
  );
}

// Product Card Selector - Clean Grid Design
// Product Wheel Selector Component (Apple Clock Style - Red Palette)
interface ProductWheelSelectorProps {
  products: Product[];
  selectedProductId: number;
  setSelectedProductId: (id: number) => void;
}

function ProductWheelSelector({ products, selectedProductId, setSelectedProductId }: ProductWheelSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const animationFrameId = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const ITEM_HEIGHT = 54; // Reduced gap but kept non-touching
  const RADIUS = 120;

  // Initialize Audio
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as unknown as WindowWithWebkit).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
    }
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Apple Clock realistic mechanical click
  const playTickSound = () => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

    const bufferSize = audioContextRef.current.sampleRate * 0.015;
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = audioContextRef.current.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContextRef.current.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    const gain = audioContextRef.current.createGain();
    gain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContextRef.current.destination);

    noise.start(audioContextRef.current.currentTime);
  };



  // Scroll Animation Helpers
  const cancelScrollAnimation = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    // Don't set isScrollingRef to false here immediately if we want to separate concerns,
    // but typically if we cancel, we are done scrolling programmatically.
    // However, user might be scrolling.
    isScrollingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.scrollSnapType = '';
    }
  };

  const smoothScrollTo = (container: HTMLElement, target: number, duration: number) => {
    cancelScrollAnimation();

    const start = container.scrollTop;
    const change = target - start;
    const startTime = performance.now();

    isScrollingRef.current = true;
    container.style.scrollSnapType = 'none';

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed > duration) {
        container.scrollTop = target;
        isScrollingRef.current = false;
        container.style.scrollSnapType = '';
        animationFrameId.current = null;
        return;
      }

      // easeInOutCubic
      let t = elapsed / duration;
      t = t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

      container.scrollTop = start + change * t;
      animationFrameId.current = requestAnimationFrame(animateScroll);
    };

    animationFrameId.current = requestAnimationFrame(animateScroll);
  };

  // Main Scroll Loop
  const lastSelectedRef = useRef(selectedProductId);
  const handleScroll = () => {
    if (!containerRef.current) return;
    // if (isScrollingRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, products.length - 1));
    const targetProduct = products[clampedIndex];

    if (targetProduct && targetProduct.id !== lastSelectedRef.current) {
      lastSelectedRef.current = targetProduct.id;
      setSelectedProductId(targetProduct.id);
      playTickSound();
    }
  };


  // Initial Setup
  useLayoutEffect(() => {
    if (containerRef.current) {
      const index = products.findIndex(p => p.id === selectedProductId);
      if (index !== -1) {
        isScrollingRef.current = true;
        containerRef.current.scrollTop = index * ITEM_HEIGHT;
        setTimeout(() => isScrollingRef.current = false, 100);
      }
    }
  }, []);

  // Sync external selection changes
  useEffect(() => {
    if (isScrollingRef.current || !containerRef.current) return;

    const index = products.findIndex(p => p.id === selectedProductId);
    if (index !== -1 && selectedProductId !== lastSelectedRef.current) {
      lastSelectedRef.current = selectedProductId;
      smoothScrollTo(containerRef.current, index * ITEM_HEIGHT, 50000);
    }
  }, [selectedProductId, products]);

  return (
    <div className="relative h-[162px] w-full overflow-hidden select-none bg-transparent rounded-2xl">
      {/* Center Highlight Zone */}
      <div className="absolute top-[54px] left-0 right-14 h-[54px] z-0 pointer-events-none" />



      {/* Scroll Container */}
      <div
        role="listbox"
        aria-label="Product Selector Wheel"
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory py-[54px] no-scrollbar relative z-20 mr-14"
        onScroll={handleScroll}
        onTouchStart={() => cancelScrollAnimation()}
        onMouseDown={() => cancelScrollAnimation()}
        onWheel={() => cancelScrollAnimation()}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!containerRef.current) return;

          const rect = containerRef.current.getBoundingClientRect();
          const clickY = e.clientY - rect.top;
          const centerY = rect.height / 2;
          const currentIndex = products.findIndex(p => p.id === selectedProductId);

          // Click above center - go to previous card
          if (clickY < centerY - ITEM_HEIGHT / 2 && currentIndex > 0) {
            const targetIndex = currentIndex - 1;
            playTickSound();
            smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 500);
          }
          // Click below center - go to next card
          else if (clickY > centerY + ITEM_HEIGHT / 2 && currentIndex < products.length - 1) {
            const targetIndex = currentIndex + 1;
            playTickSound();
            smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 500);
          }
        }}
        style={{
          scrollBehavior: 'auto'
        }}
      >
        <div className="relative">
          {products.map((product, i) => {
            const isSelected = product.id === selectedProductId;

            return (
              <div
                key={product.id}
                role="option"
                aria-selected={isSelected ? "true" : "false"}
                className="h-[54px] flex items-center justify-center snap-center w-full"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation(); // Prevent container onClick from interfering
                  setSelectedProductId(product.id);
                  playTickSound();
                }}
              >
                {/* Compact iOS Clock style cards */}
                <div
                  style={{ zIndex: isSelected ? 50 : products.length - i }}
                  className={`mx-3 px-5 rounded-full flex items-center gap-3 transition-all duration-300 ease-out origin-center
                    ${isSelected
                      ? 'w-[237px] bg-gradient-to-br from-apple-red to-red-600 scale-105 py-1.5 shadow-xl text-white justify-center'
                      : 'w-[201px] bg-red-50/50 border-2 border-red-100 text-apple-gray hover:text-black hover:scale-105 py-[6px] justify-center'
                    }`}>

                  <ChefHat size={20} className={isSelected ? 'text-white' : 'text-apple-gray'} />

                  <span className={`tracking-tight cursor-pointer
                            ${isSelected ? 'font-black text-lg border-b-[3px] border-white/60 pb-0.5' : 'font-medium text-base'}`}>
                    {product.name}
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      </div>


      {/* Navigation Buttons - Positioned right beside the card edge */}
      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40 translate-x-[102px]">
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (!containerRef.current) return;
            const currentIndex = products.findIndex((p: Product) => p.id === selectedProductId);
            if (currentIndex > 0) {
              const targetIndex = currentIndex - 1;
              playTickSound();
              smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 300);
            }
          }}
          className="p-2 rounded-full bg-gradient-to-br from-apple-red to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous Product"
          aria-label="Previous Product"
          disabled={products.findIndex((p: Product) => p.id === selectedProductId) <= 0}
        >
          <ChevronUp size={20} strokeWidth={3} />
        </button>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (!containerRef.current) return;
            const currentIndex = products.findIndex((p: Product) => p.id === selectedProductId);
            if (currentIndex < products.length - 1) {
              const targetIndex = currentIndex + 1;
              playTickSound();
              smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 300);
            }
          }}
          className="p-2 rounded-full bg-gradient-to-br from-apple-red to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next Product"
          aria-label="Next Product"
          disabled={products.findIndex((p: Product) => p.id === selectedProductId) >= products.length - 1}
        >
          <ChevronDown size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// Sub-components
interface CalculatorInputProps {
  label: string;
  unit: string;
  value: string | number;
  onChange: (val: string) => void;
  highlight?: boolean;
}

function CalculatorInput({ label, unit, value, onChange, highlight }: CalculatorInputProps) {
  return (
    <div className={`bg-apple-bg rounded-lg px-2 py-1 relative group focus-within:ring-1 focus-within:ring-apple-red/50 transition-all ${highlight ? 'border-2 border-black' : ''}`}>
      <label className={`text-[9px] font-semibold absolute top-1 left-3 ${highlight ? 'text-black font-extrabold' : 'text-apple-gray'}`}>{label}</label>
      <div className="flex items-baseline justify-center mt-3 mb-1 w-full gap-0.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-lg font-bold text-black outline-none p-0 placeholder-gray-300 text-right min-w-[30px] w-fit max-w-[60%]"
          placeholder="--"
          aria-label={label}
        />
        <span className="text-xs font-medium text-gray-400 flex-none">{unit}</span>
      </div>
    </div>
  );
}

interface HistoryRowProps {
  bake: Bake;
  t: Translation;
  updateBake: (id: number, field: keyof Bake, value: string | number) => void;
  deleteBake: (id: number) => void;
}

function HistoryRow({ bake, t, updateBake, deleteBake }: HistoryRowProps) {
  return (
    <div className="group p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 overflow-hidden">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {/* Date */}
        <div className="flex-none w-[140px] sticky left-0 bg-white group-hover:bg-gray-50 z-10 pr-6 transition-colors">
          <label className="text-[9px] text-gray-400 block mb-0.5">{t.date}</label>
          <div className="relative group/date h-[28px]">
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black pointer-events-none z-20">
              {bake.date ? bake.date.replace(/-/g, '/') : '----/--/--'}
            </div>
            <input
              type="date"
              value={bake.date}
              onChange={(e) => updateBake(bake.id, 'date', e.target.value)}
              className="w-full h-full text-xs font-medium bg-apple-bg rounded outline-none focus:ring-1 focus:ring-apple-red appearance-none text-transparent relative z-10 apple-date-picker"
              aria-label="Bake Date"
            />
            <Calendar size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none z-30" />
          </div>
        </div>

        {[
          { label: t.room, key: 'roomTemp' },
          { label: t.flour, key: 'flourTemp' },
          { label: t.levain, key: 'levainTemp' },
          { label: t.water, key: 'waterTemp' },
          { label: t.final, key: 'finalTemp' },
          { label: t.mixShort, key: 'mixTime' },
          { label: t.hydrShort, key: 'hydration' }
        ].map((field) => (
          <div key={field.key} className="flex-none w-14 text-center">
            <label className={`${field.key === 'waterTemp' ? 'text-[5px]' : 'text-[8px]'} text-gray-400 block mb-0.5 whitespace-nowrap`}>{field.label}</label>
            <input
              type="number"
              placeholder="--"
              className="w-full text-center text-xs font-medium bg-apple-bg rounded py-1.5 outline-none focus:ring-1 focus:ring-apple-red"
              value={bake[field.key as keyof Bake]}
              onChange={(e) => updateBake(bake.id, field.key as keyof Bake, e.target.value)}
              aria-label={field.label}
            />
          </div>
        ))}

        {/* Friction */}
        <div className="flex-none w-14 text-center">
          <label className="text-[9px] text-gray-400 block mb-0.5 text-apple-red font-bold">{t.friction}</label>
          <div className="text-xs font-bold text-apple-red bg-apple-red/5 rounded py-1.5">
            {calculateSimpleFriction(bake)}
          </div>
        </div>

        {/* Delete */}
        <div className="flex-none w-8 flex items-center justify-center pt-3">
          <button onClick={() => deleteBake(bake.id)} className="text-gray-300 hover:text-apple-red transition-colors" title="Delete Bake" aria-label="Delete Bake">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
