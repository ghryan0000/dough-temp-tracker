import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Plus, Trash2, Download, TrendingUp, AlertCircle, Calculator, ChefHat, Package, Search, ChevronRight, BarChart3, Wind, Activity, Pencil, Check, ChevronDown, ChevronUp, ArrowUp, ArrowDown, X } from 'lucide-react';


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
export default function DoughTempTracker() {
  // Product colors for dynamic assignment
  const productColors: string[] = ['bg-amber-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500'];

  // Translations
  const translations = {
    en: {
      appTitle: "Ryan's Bakery",
      appSubtitle: "Water Temperature Tracker",
      modelReady: "Model Ready",
      selectProduct: "Select Product",
      scrollToSelect: "Scroll to select",
      calculatorTitle: "Calculate Water Temp",
      enterData: "Enter variables",
      targetWaterTemp: "TARGET WATER TEMP",
      calculateButton: "Calculate Water Temp",
      historyTitle: "MLR Training History",
      entries: "Entries",
      noData: "No training data yet.",
      addBakesHint: "Add previous bakes to train the model.",
      yourProducts: "Your Products",
      friction: "Friction",
      date: "Date",
      // Field Labels
      room: "Room",
      flour: "Flour",
      levain: "Levain",
      target: "Target Temp",
      mix: "Mix Time", // Expanded for clarity in calc
      hydration: "Hydration",
      water: "Water",
      final: "Final",
      mixShort: "Mix", // For table headers
      hydrShort: "Hydr %",
      mlrTraining: "MLR Training",
      sessions: "Sessions",
      model: "Model",
      coefficients: "Coefficients",
      frictionPerMin: "Friction/min",
      hydrationPercent: "Hydration/%",
      quality: "Quality",
      fit: "Fit",
      // Documentation
      aboutTitle: "About This App",
      aboutContent: "Ryan's Bakery Water Temperature Tracker ensures consistent dough by calculating the precise water temperature needed. It uses Multiple Linear Regression (MLR) to learn from your past baking sessions, adapting to your specific environment and ingredients.",
      howToUseTitle: "How to Use",
      step1Title: "Select Product",
      step1Content: "Scroll the wheel to select a dough type.",
      step2Title: "Calculate Temp",
      step2Content: "Enter current conditions (Room, Flour, etc.) to get the Target Water Temp.",
      step3Title: "Record Session",
      step3Content: "After mixing, use 'Add Session' to log the actual results to train the MLR model.",
      step4Title: "Export Data",
      step4Content: "Download your baking history as a CSV file.",
      step5Title: "Manage Products",
      step5Content: "Add, rename, reorder, or delete products below.",
    },
    zh: {
      appTitle: "Ryan's Bakery",
      appSubtitle: "水溫追蹤器",
      modelReady: "模型就緒",
      selectProduct: "選擇產品",
      scrollToSelect: "滾動選擇",
      calculatorTitle: "計算水溫",
      enterData: "輸入變數",
      targetWaterTemp: "目標水溫",
      calculateButton: "計算水溫",
      historyTitle: "MLR 訓練歷史",
      entries: "條紀錄",
      noData: "暫無訓練數據",
      addBakesHint: "添加過往烘焙紀錄以訓練模型",
      yourProducts: "您的產品",
      friction: "摩擦升溫",
      date: "日期",
      room: "室溫",
      flour: "粉溫",
      levain: "酵種",
      target: "目標溫度",
      mix: "攪拌時間",
      hydration: "含水量",
      water: "水溫",
      final: "最終",
      mixShort: "攪拌",
      hydrShort: "含水%",
      mlrTraining: "MLR 訓練",
      sessions: "訓練場次",
      model: "模型",
      coefficients: "係數",
      frictionPerMin: "摩擦升溫/分",
      hydrationPercent: "含水量/%",
      quality: "品質",
      fit: "擬合度",
      // Documentation
      aboutTitle: "關於本應用",
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
    },
    ja: {
      appTitle: "ライアンのベーカリー",
      appSubtitle: "水温トラッカー",
      modelReady: "モデル準備完了",
      selectProduct: "製品を選択",
      scrollToSelect: "スクロールして選択",
      calculatorTitle: "水温を計算",
      enterData: "変数を入力",
      targetWaterTemp: "目標水温",
      calculateButton: "水温を計算",
      historyTitle: "MLR 学習履歴",
      entries: "件",
      noData: "データがありません",
      addBakesHint: "過去のデータを追加してモデルを学習",
      yourProducts: "製品一覧",
      friction: "摩擦熱",
      date: "日付",
      room: "室温",
      flour: "粉温",
      levain: "種温",
      target: "目標温度",
      mix: "ミキシング",
      hydration: "加水率",
      water: "水温",
      final: "捏上",
      mixShort: "ミキシング",
      hydrShort: "加水%",
      mlrTraining: "MLR 学習",
      sessions: "セッション",
      model: "モデル",
      coefficients: "係数",
      frictionPerMin: "摩擦/分",
      hydrationPercent: "加水率/%",
      quality: "品質",
      fit: "適合度",
      // Documentation
      aboutTitle: "このアプリについて",
      aboutContent: "Ryan's Bakery 水温トラッカーは、理想的な水温を計算し、安定した生地作りをサポートします。重回帰分析 (MLR) を用いて過去のデータから学習し、環境に応じた最適な水温を予測します。",
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
    }
  };

  type Language = 'en' | 'zh' | 'ja';
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const t = translations[language];

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
      const productNames = JSON.parse(oldFormat);
      const migratedProducts = productNames.map((name, index) => ({
        id: index + 1,
        name: name,
        color: productColors[index % productColors.length]
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
      const oldBakes = JSON.parse(oldFormat);
      const migratedBakes = oldBakes.map(bake => {
        const product = products.find(p => p.name === bake.productType);
        const { productType, ...rest } = bake;
        return { ...rest, productId: product ? product.id : 1 };
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
      color: productColors[products.length % productColors.length]
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

  const [regressionModel, setRegressionModel] = useState<RegressionModel | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [currentConditions, setCurrentConditions] = useState<Record<string, string | number>>({
    roomTemp: 22,
    flourTemp: 20,
    levainTemp: 24,
    mixTime: 5,
    hydration: 70
  });

  const calculateRegression = () => {
    const validBakes = bakes.filter(b =>
      b.productId === selectedProductId &&
      b.roomTemp !== '' && b.flourTemp !== '' && b.waterTemp !== '' &&
      b.levainTemp !== '' && b.finalTemp !== '' && b.mixTime !== '' && b.hydration !== ''
    );

    if (validBakes.length < 3) {
      setDebugInfo(`Need at least 3 complete baking sessions. Currently have: ${validBakes.length}`);
      return null;
    }

    try {
      const n = validBakes.length;
      const y = validBakes.map(b => parseFloat(b.waterTemp));
      const rawX = validBakes.map(b => [
        1, parseFloat(b.roomTemp), parseFloat(b.flourTemp), parseFloat(b.levainTemp),
        parseFloat(b.finalTemp), parseFloat(b.mixTime), parseFloat(b.hydration)
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

      if (!beta || beta.some(isNaN) || beta.some(val => !isFinite(val))) {
        setDebugInfo(`Regression failed. Try adding more varied data.`);
        return null;
      }

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
      setDebugInfo(`✅ Regression successful! R² = ${rSquared.toFixed(3)}, n = ${n}`);

      return {
        intercept: denormBeta[0], roomCoef: denormBeta[1], flourCoef: denormBeta[2],
        levainCoef: denormBeta[3], targetCoef: denormBeta[4], mixTimeCoef: denormBeta[5],
        hydrationCoef: denormBeta[6], rSquared: rSquared, nSamples: n
      };
    } catch (error: any) {
      setDebugInfo(`❌ Error: ${error.message}`);
      return null;
    }
  };

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

  useEffect(() => {
    const model = calculateRegression();
    setRegressionModel(model);
  }, [bakes, selectedProductId]);

  const addBake = () => {
    const newId = bakes.length > 0 ? Math.max(...bakes.map(b => b.id)) + 1 : 1;
    setBakes([...bakes, {
      id: newId, productId: selectedProductId, date: new Date().toISOString().split('T')[0], roomTemp: '', flourTemp: '',
      waterTemp: '', levainTemp: '', finalTemp: '', mixTime: '', hydration: ''
    }]);
  };

  const deleteBake = (id: number) => setBakes(bakes.filter(b => b.id !== id));
  const updateBake = (id: number, field: keyof Bake, value: string | number) => setBakes(bakes.map(b => b.id === id ? { ...b, [field]: value } : b));
  const updateCurrentCondition = (field: string, value: string | number) => setCurrentConditions({ ...currentConditions, [field]: value });

  const calculateSimpleFriction = (bake: Bake) => {
    const { roomTemp, flourTemp, waterTemp, levainTemp, finalTemp } = bake;
    if (!roomTemp || !flourTemp || !waterTemp || !levainTemp || !finalTemp) return '-';
    return ((5 * parseFloat(finalTemp)) - (parseFloat(roomTemp) + parseFloat(flourTemp) + parseFloat(waterTemp) + parseFloat(levainTemp))).toFixed(1);
  };

  const predictWaterTemp = (roomTemp: number | string, flourTemp: number | string, levainTemp: number | string, targetFinal: number | string, mixTime: number | string, hydration: number | string) => {
    if (!regressionModel) return null;
    return regressionModel.intercept + regressionModel.roomCoef * parseFloat(roomTemp) +
      regressionModel.flourCoef * parseFloat(flourTemp) + regressionModel.levainCoef * parseFloat(levainTemp) +
      regressionModel.targetCoef * parseFloat(targetFinal) + regressionModel.mixTimeCoef * parseFloat(mixTime) +
      regressionModel.hydrationCoef * parseFloat(hydration);
  };

  const currentPredictedWater = predictWaterTemp(
    currentConditions.roomTemp, currentConditions.flourTemp, currentConditions.levainTemp,
    targetTemp, currentConditions.mixTime, currentConditions.hydration
  );

  const exportCSV = () => {
    const product = products.find(p => p.id === selectedProductId);
    const productBakes = bakes.filter(b => b.productId === selectedProductId);
    const headers = ['Date', 'Product', 'Room', 'Flour', 'Water', 'Levain', 'Final', 'Mix', 'Hydration', 'Friction'];
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

  const currentProduct = products.find(p => p.id === selectedProductId);
  const currentBakes = bakes.filter(b => b.productId === selectedProductId);
  const productCounts = products.map(product => ({
    id: product.id,
    name: product.name,
    count: bakes.filter(b => b.productId === product.id && b.roomTemp !== '').length
  }));

  // Update regression model when product changes or bakes update
  useEffect(() => {
    setRegressionModel(calculateRegression(bakes, selectedProductId));
  }, [bakes, selectedProductId]);



  return (
    <div className="min-h-screen bg-apple-bg pt-6 pb-20 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header - Compact */}
        {/* Header - Compact */}
        <div className="flex items-end justify-between mb-4 -mx-4 px-4 py-2 bg-gradient-to-r from-apple-red/90 to-red-600/90 shadow-sm">
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
              products={[...products].sort((a, b) => a.name.localeCompare(b.name))}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              productCounts={productCounts}
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

            <div className="bg-white rounded-3xl shadow-lg border border-red-50 p-4 md:p-8 relative overflow-hidden w-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-apple-red/5 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

              {/* Target Display */}
              <div className={`py-1 px-3 md:p-4 rounded-2xl text-center mb-4 md:mb-8 border-2 transition-all duration-500 relative overflow-hidden ${regressionModel ? 'bg-gradient-to-br from-red-100 to-red-50 border-apple-red/20 shadow-inner' : 'bg-gray-100 border-transparent'}`}>
                <div className="text-[10px] font-bold text-apple-gray uppercase tracking-wider">{t.targetWaterTemp}</div>
                <div className={`text-3xl md:text-5xl font-black tracking-tighter leading-none ${currentPredictedWater ? 'text-apple-red' : 'text-gray-300'}`}>
                  {currentPredictedWater !== null ? currentPredictedWater.toFixed(1) : '--'}
                  <span className="text-lg md:text-2xl ml-1 font-medium text-gray-400">°C</span>
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: t.room, key: 'roomTemp', unit: '°C' },
                  { label: t.flour, key: 'flourTemp', unit: '°C' },
                  { label: t.levain, key: 'levainTemp', unit: '°C' },
                  { label: t.target, key: 'target', unit: '°C', value: targetTemp, setter: setTargetTemp },
                  { label: t.mix, key: 'mixTime', unit: 'min' },
                  { label: t.hydration, key: 'hydration', unit: '%' }
                ].map((field) => (
                  <div key={field.label} className="bg-apple-bg rounded-lg px-3 py-1.5 relative group focus-within:ring-1 focus-within:ring-apple-red/50 transition-all">
                    <label className="text-[9px] font-semibold text-apple-gray absolute top-1 left-3">{field.label}</label>
                    <div className="flex items-baseline mt-3.5">
                      <input
                        type="number"
                        value={field.key === 'target' ? targetTemp : currentConditions[field.key]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.key === 'target' ? setTargetTemp(e.target.value) : updateCurrentCondition(field.key, e.target.value)}
                        className="w-full bg-transparent text-lg font-bold text-black outline-none p-0 placeholder-gray-300"
                        placeholder="--"
                        aria-label={field.label}
                      />
                      <span className="text-xs font-medium text-gray-400 ml-1">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result Display */}
              {/* This section was replaced by the new Target Display and Input Grid above */}
              {/*
            <div className={`p-2 rounded-xl text-center transition-all ${regressionModel ? 'bg-red-100 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <div className="text-[10px] font-bold text-apple-gray uppercase tracking-wider">TARGET WATER TEMP</div>
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

              {/* Model Training Status - Detailed View */}
              {regressionModel && (
                <div className="mt-3 p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl">
                  <div className="flex flex-col items-start mb-3 gap-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} className="text-purple-600" />
                      <span className="text-sm font-bold text-purple-900">{t.mlrTraining}: {currentProduct?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <Activity size={10} /> {t.modelReady}
                      </span>
                      <span className="text-[10px] font-medium text-apple-gray bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-sm">
                        {t.sessions}: {regressionModel.nSamples}
                      </span>
                    </div>
                  </div>

                  {/* Regression Formula */}
                  <div className="mb-3 p-3 bg-white rounded-lg border border-purple-100">
                    <div className="flex items-end gap-1.5 mb-2">
                      <BarChart3 size={12} className="text-purple-600" />
                      <span className="text-[14px] underline font-bold text-purple-900">{t.model}</span>
                      <span className="text-[11px] text-gray-400 font-normal ml-2">Auto-saved • Updates with each new session</span>
                    </div>
                    <div className="font-mono text-[11px] text-gray-700 leading-relaxed overflow-x-auto">
                      Water = {regressionModel.intercept.toFixed(2)}
                      {regressionModel.roomCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.roomCoef).toFixed(2)}×{t.room}
                      {regressionModel.flourCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.flourCoef).toFixed(2)}×{t.flour}
                      {regressionModel.levainCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.levainCoef).toFixed(2)}×{t.levain}
                      {regressionModel.targetCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.targetCoef).toFixed(2)}×{t.target}
                      {regressionModel.mixTimeCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.mixTimeCoef).toFixed(2)}×{t.mix}
                      {regressionModel.hydrationCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.hydrationCoef).toFixed(2)}×{t.hydration}
                    </div>
                  </div>

                  {/* Coefficients and Quality Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Coefficients */}
                    <div className="bg-white rounded-lg p-2.5 border border-orange-100">
                      <div className="flex items-center gap-1 mb-2">
                        <Activity size={11} className="text-orange-600" />
                        <span className="text-[14px] underline font-bold text-orange-900">{t.coefficients}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-gray-600">🔥 {t.frictionPerMin}:</span>
                          <span className="text-[10px] font-bold text-orange-600">{regressionModel.mixTimeCoef.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-gray-600">💧 {t.hydrationPercent}:</span>
                          <span className="text-[10px] font-bold text-blue-600">{regressionModel.hydrationCoef.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quality */}
                    <div className="bg-white rounded-lg p-2.5 border border-pink-100">
                      <div className="flex items-center gap-1 mb-2">
                        <TrendingUp size={11} className="text-pink-600" />
                        <span className="text-[14px] underline font-bold text-pink-900">{t.quality}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-gray-600">R²:</span>
                          <span className="text-[10px] font-bold text-pink-600">{regressionModel.rSquared.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-gray-600">{t.fit}:</span>
                          <span className="text-[9px] font-medium text-green-600">
                            {regressionModel.rSquared >= 0.9 ? '✅ Excellent' : regressionModel.rSquared >= 0.7 ? '⚠️ Good' : '❌ Need More Data'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-gray-600">Samples:</span>
                          <span className="text-[10px] font-bold text-gray-700">{regressionModel.nSamples}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="px-1">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-black flex items-center gap-2 mb-2">
              <BarChart3 size={18} className="text-apple-red" /> MLR Training History ({currentProduct?.name})
            </h2>
            <div className="flex gap-2">
              <button onClick={addBake} className="bg-apple-red hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                <Plus size={14} /> Add Session
              </button>
              <button onClick={exportCSV} className="text-xs font-medium text-apple-gray hover:text-black flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full transition-colors">
                <Download size={12} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {currentBakes.length === 0 ? (
              <div className="p-8 text-center text-apple-gray">
                <p className="text-sm">No sessions recorded for {currentProduct?.name}</p>
              </div>
            ) : (
              currentBakes.slice().reverse().map((bake) => (
                <div key={bake.id} className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                  <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {/* Date */}
                    <div className="flex-none w-28 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] mr-2">
                      <label className="text-[9px] text-gray-400 block mb-0.5">{t.date}</label>
                      <input
                        type="date"
                        value={bake.date}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBake(bake.id, 'date', e.target.value)}
                        className="w-full text-xs font-bold text-black bg-apple-bg rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-apple-red"
                        aria-label="Bake Date"
                      />
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
                        <label className="text-[9px] text-gray-400 block mb-0.5 whitespace-nowrap">{field.label}</label>
                        <input
                          type="number"
                          placeholder="--"
                          className="w-full text-center text-xs font-medium bg-apple-bg rounded py-1.5 outline-none focus:ring-1 focus:ring-apple-red"
                          value={bake[field.key as keyof Bake]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBake(bake.id, field.key as keyof Bake, e.target.value)}
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
              ))
            )}
          </div>
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
              <Package size={14} />
              {showProductManager ? 'Hide Manager' : 'Show Manager'}
              <ChevronDown className={`ml-1 transform transition-transform ${showProductManager ? 'rotate-180' : ''}`} size={14} />
            </button>
          </div>

          {showProductManager && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              {/* Add Product */}
              <div className="mb-4 mt-4">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Add New Product</label>
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
                <label className="text-xs font-semibold text-gray-600 block">{t.yourProducts}</label>
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
        <div className="mt-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-black mb-2 flex items-center gap-2">
              <Activity size={16} className="text-apple-red" /> {t.aboutTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t.aboutContent}
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-black mb-3 flex items-center gap-2">
              <ChevronRight size={16} className="text-purple-600" /> {t.howToUseTitle}
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              {[
                { title: t.step1Title, content: t.step1Content },
                { title: t.step2Title, content: t.step2Content },
                { title: t.step3Title, content: t.step3Content },
                { title: t.step4Title, content: t.step4Content },
                { title: t.step5Title, content: t.step5Content },
              ].map((step, index) => (
                <div key={index} className="flex gap-2">
                  <span className="font-semibold text-purple-600 min-w-[20px]">{index + 1}.</span>
                  <div>
                    <strong>{step.title}:</strong> {step.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div >
  );
}

// Product Card Selector - Clean Grid Design
// Product Wheel Selector Component (Apple Clock Style - Red Palette)
interface ProductWheelSelectorProps {
  products: Product[];
  selectedProductId: number;
  setSelectedProductId: (id: number) => void;
  productCounts: ProductCount[];
}

function ProductWheelSelector({ products, selectedProductId, setSelectedProductId, productCounts }: ProductWheelSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const animationFrameId = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const ITEM_HEIGHT = 54; // Reduced gap but kept non-touching
  const RADIUS = 120;

  // Initialize Audio
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
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
