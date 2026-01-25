import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Plus, Trash2, Download, TrendingUp, AlertCircle, Calculator, ChefHat, Package, Search, ChevronRight, BarChart3, Wind, Activity, Pencil, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function DoughTempTracker() {
  // Product colors for dynamic assignment
  const productColors = ['bg-amber-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500'];

  // Data migration and initialization
  const [products, setProducts] = useState(() => {
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

  const [selectedProductId, setSelectedProductId] = useState(() => {
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

  const [targetTemp, setTargetTemp] = useState(25);
  const [bakes, setBakes] = useState(() => {
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

  const deleteProduct = (id) => {
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

  const handleRenameProduct = (id, newName) => {
    if (!newName.trim()) return;
    const product = products.find(p => p.id === id);
    if (!product || product.name === newName) return;

    setProducts(products.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const [regressionModel, setRegressionModel] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [currentConditions, setCurrentConditions] = useState({
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

      const means = [];
      const stds = [];
      for (let j = 1; j < 7; j++) {
        const values = rawX.map(row => row[j]);
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const std = Math.sqrt(variance) || 1;
        means.push(mean);
        stds.push(std);
      }

      const X = rawX.map(row => [row[0], ...row.slice(1).map((val, idx) => (val - means[idx]) / stds[idx])]);
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
    } catch (error) {
      setDebugInfo(`❌ Error: ${error.message}`);
      return null;
    }
  };

  const solveRobust = (X, y) => {
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

  const gaussianEliminationPivot = (A, b) => {
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

  const deleteBake = (id) => setBakes(bakes.filter(b => b.id !== id));
  const updateBake = (id, field, value) => setBakes(bakes.map(b => b.id === id ? { ...b, [field]: value } : b));
  const updateCurrentCondition = (field, value) => setCurrentConditions({ ...currentConditions, [field]: value });

  const calculateSimpleFriction = (bake) => {
    const { roomTemp, flourTemp, waterTemp, levainTemp, finalTemp } = bake;
    if (!roomTemp || !flourTemp || !waterTemp || !levainTemp || !finalTemp) return '-';
    return ((5 * parseFloat(finalTemp)) - (parseFloat(roomTemp) + parseFloat(flourTemp) + parseFloat(waterTemp) + parseFloat(levainTemp))).toFixed(1);
  };

  const predictWaterTemp = (roomTemp, flourTemp, levainTemp, targetFinal, mixTime, hydration) => {
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
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">Ryan's Bakery</h1>
            <p className="text-apple-gray text-xs font-medium">Water Temperature Tracker</p>
          </div>
          {regressionModel && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <Activity size={10} /> Model Ready
            </span>
          )}
        </div>

        {/* Main Content Grid: Product Selector (Jukebox) | Calculator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-start">

          {/* Left Column: Product Selector (Card Grid) */}
          <div className="md:col-span-4 flex flex-col w-full max-w-xs mx-auto md:max-w-none md:mx-0">
            <h2 className="text-lg font-bold text-black flex items-center gap-2 mb-1 px-1">
              <Package size={18} className="text-apple-red" /> Select Product
            </h2>
            <p className="text-xs text-apple-gray mb-4 px-1 text-center font-medium">
              Scroll to select • Click pencil to rename
            </p>
            <ProductWheelSelector
              products={products}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              productCounts={productCounts}
              onRename={handleRenameProduct}
            />
          </div>

          {/* Right Column: Calculator */}
          <div className="md:col-span-8 bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-black flex items-center gap-2">
                <Calculator size={18} className="text-apple-red" /> Target Water Temp Calculator
              </h2>
            </div>

            {/* Inputs with Units */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Room Temp', key: 'roomTemp', unit: '°C' },
                { label: 'Flour Temp', key: 'flourTemp', unit: '°C' },
                { label: 'Levain Temp', key: 'levainTemp', unit: '°C' },
                { label: 'Mix Time', key: 'mixTime', unit: 'min' },
                { label: 'Target Temp', key: 'target', unit: '°C', value: targetTemp, setter: setTargetTemp },
                { label: 'Hydration', key: 'hydration', unit: '%' }
              ].map((field) => (
                <div key={field.label} className="bg-apple-bg rounded-lg px-3 py-1.5 relative group focus-within:ring-1 focus-within:ring-apple-red/50 transition-all">
                  <label className="text-[9px] font-semibold text-apple-gray absolute top-1 left-3">{field.label}</label>
                  <div className="flex items-baseline mt-3.5">
                    <input
                      type="number"
                      value={field.key === 'target' ? targetTemp : currentConditions[field.key]}
                      onChange={(e) => field.key === 'target' ? setTargetTemp(e.target.value) : updateCurrentCondition(field.key, e.target.value)}
                      className="w-full bg-transparent text-lg font-bold text-black outline-none p-0 placeholder-gray-300"
                      placeholder="--"
                    />
                    <span className="text-xs font-medium text-gray-400 ml-1">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Result Display */}
            <div className={`p-2 rounded-xl text-center transition-all ${regressionModel ? 'bg-red-100 border border-red-200' : 'bg-gray-50'}`}>
              <div className="text-[10px] font-bold text-apple-gray uppercase tracking-wider mb-0.5">TARGET WATER TEMP</div>
              <div className={`text-3xl font-black tracking-tighter ${currentPredictedWater ? 'text-apple-red' : 'text-gray-300'}`}>
                {currentPredictedWater !== null ? currentPredictedWater.toFixed(1) : '--'}
                <span className="text-sm ml-0.5 font-medium text-gray-400">°C</span>
              </div>
            </div>

            {/* Model Training Status - Detailed View */}
            {regressionModel && (
              <div className="mt-3 p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-purple-600" />
                    <span className="text-sm font-bold text-purple-900">MLR Training: {currentProduct?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ Trained! R²={regressionModel.rSquared.toFixed(3)}
                    </span>
                    <span className="text-[10px] font-medium text-gray-500">
                      Sessions: {regressionModel.nSamples}
                    </span>
                  </div>
                </div>

                {/* Regression Formula */}
                <div className="mb-3 p-3 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BarChart3 size={12} className="text-purple-600" />
                    <span className="text-[10px] font-bold text-purple-900">Model</span>
                  </div>
                  <div className="font-mono text-[11px] text-gray-700 leading-relaxed overflow-x-auto">
                    Water = {regressionModel.intercept.toFixed(2)}
                    {regressionModel.roomCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.roomCoef).toFixed(2)}×Room
                    {regressionModel.flourCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.flourCoef).toFixed(2)}×Flour
                    {regressionModel.levainCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.levainCoef).toFixed(2)}×Levain
                    {regressionModel.targetCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.targetCoef).toFixed(2)}×Target
                    {regressionModel.mixTimeCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.mixTimeCoef).toFixed(2)}×Mix
                    {regressionModel.hydrationCoef >= 0 ? ' + ' : ' - '}{Math.abs(regressionModel.hydrationCoef).toFixed(2)}×Hydration
                  </div>
                </div>

                {/* Coefficients and Quality Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Coefficients */}
                  <div className="bg-white rounded-lg p-2.5 border border-orange-100">
                    <div className="flex items-center gap-1 mb-2">
                      <Activity size={11} className="text-orange-600" />
                      <span className="text-[9px] font-bold text-orange-900">Coefficients</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-600">🔥 Friction/min:</span>
                        <span className="text-[10px] font-bold text-orange-600">{regressionModel.mixTimeCoef.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-600">💧 Hydration/%:</span>
                        <span className="text-[10px] font-bold text-blue-600">{regressionModel.hydrationCoef.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality */}
                  <div className="bg-white rounded-lg p-2.5 border border-pink-100">
                    <div className="flex items-center gap-1 mb-2">
                      <TrendingUp size={11} className="text-pink-600" />
                      <span className="text-[9px] font-bold text-pink-900">Quality</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-600">R²:</span>
                        <span className="text-[10px] font-bold text-pink-600">{regressionModel.rSquared.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-600">Fit:</span>
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

                <div className="mt-2 text-[8px] text-gray-400 text-center">
                  Auto-saved • Updates with each new session
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="px-1">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-black flex items-center gap-2 mb-2">
              <BarChart3 size={18} className="text-apple-red" /> MLR Training History ({currentProduct?.name})
            </h2>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="text-xs font-medium text-apple-gray hover:text-black flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full transition-colors">
                <Download size={12} /> Export CSV
              </button>
              <button onClick={addBake} className="bg-apple-red hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1">
                <Plus size={14} /> Add Session
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
                      <label className="text-[9px] text-gray-400 block mb-0.5">Date</label>
                      <input
                        type="date"
                        value={bake.date}
                        onChange={(e) => updateBake(bake.id, 'date', e.target.value)}
                        className="w-full text-xs font-bold text-black bg-apple-bg rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-apple-red"
                      />
                    </div>

                    {[
                      { label: 'Room', key: 'roomTemp' },
                      { label: 'Flour', key: 'flourTemp' },
                      { label: 'Levain', key: 'levainTemp' },
                      { label: 'Water', key: 'waterTemp' },
                      { label: 'Final', key: 'finalTemp' },
                      { label: 'Mix', key: 'mixTime' },
                      { label: 'Hydr %', key: 'hydration' }
                    ].map((field) => (
                      <div key={field.key} className="flex-none w-14 text-center">
                        <label className="text-[9px] text-gray-400 block mb-0.5 whitespace-nowrap">{field.label}</label>
                        <input
                          type="number"
                          placeholder="--"
                          className="w-full text-center text-xs font-medium bg-apple-bg rounded py-1.5 outline-none focus:ring-1 focus:ring-apple-red"
                          value={bake[field.key]}
                          onChange={(e) => updateBake(bake.id, field.key, e.target.value)}
                        />
                      </div>
                    ))}

                    {/* Friction */}
                    <div className="flex-none w-14 text-center">
                      <label className="text-[9px] text-gray-400 block mb-0.5 text-apple-red font-bold">Friction</label>
                      <div className="text-xs font-bold text-apple-red bg-apple-red/5 rounded py-1.5">
                        {calculateSimpleFriction(bake)}
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="flex-none w-8 flex items-center justify-center pt-3">
                      <button onClick={() => deleteBake(bake.id)} className="text-gray-300 hover:text-apple-red transition-colors">
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
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              <Package size={18} className="text-purple-600" /> Manage Products
            </h2>
            <button
              onClick={() => setShowProductManager(!showProductManager)}
              className="text-apple-gray hover:text-black transition-colors"
            >
              <ChevronDown className={`transform transition-transform ${showProductManager ? 'rotate-180' : ''}`} size={18} />
            </button>
          </div>

          {showProductManager && (
            <div>
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
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Product List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 block">Your Products</label>
                {products.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="text-xs text-gray-400">
                        ({bakes.filter(b => b.productId === product.id).length} sessions)
                      </span>
                    </div>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={products.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              <Activity size={16} className="text-apple-red" /> About This App
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ryan's Bakery Water Temperature Tracker helps you achieve consistent dough temperatures by calculating the ideal water temperature for your recipes. Using Multiple Linear Regression (MLR), the app learns from your baking sessions to predict optimal water temperatures based on environmental conditions.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-black mb-3 flex items-center gap-2">
              <ChevronRight size={16} className="text-purple-600" /> How to Use
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-2">
                <span className="font-semibold text-purple-600 min-w-[20px]">1.</span>
                <div>
                  <strong>Select Your Product:</strong> Rotate the jukebox carousel or click a product card to switch between different dough types.
                </div>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-purple-600 min-w-[20px]">2.</span>
                <div>
                  <strong>Use the Calculator:</strong> Enter room temp, flour temp, levain temp, target dough temp, mix time, and hydration to get the recommended water temperature.
                </div>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-purple-600 min-w-[20px]">3.</span>
                <div>
                  <strong>Train the Model:</strong> Click "Add Session" to record actual baking data. The more sessions you add, the more accurate the predictions become.
                </div>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-purple-600 min-w-[20px]">4.</span>
                <div>
                  <strong>Export Data:</strong> Use the "Export CSV" button to download your baking history for analysis or backup.
                </div>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-purple-600 min-w-[20px]">5.</span>
                <div>
                  <strong>Manage Products:</strong> Add, rename, or delete product types to customize the app for your bakery's needs.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Product Card Selector - Clean Grid Design
// Product Wheel Selector Component (Apple Clock Style - Red Palette)
interface Product {
  id: string;
  name: string;
}

interface ProductCount {
  id: string;
  count: number;
}

interface ProductWheelSelectorProps {
  products: Product[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  productCounts: ProductCount[];
  onRename: (id: string, newName: string) => void;
}

function ProductWheelSelector({ products, selectedProductId, setSelectedProductId, productCounts, onRename }: ProductWheelSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const isScrollingRef = useRef(false);
  const animationFrameId = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const ITEM_HEIGHT = 36; // Reduced to minimize spacing
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

  // 3D Transform Logic - NO OPACITY OVERRIDE
  const updateTransforms = () => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const containerCenter = scrollTop + (containerRef.current.clientHeight / 2);

    itemsRef.current.forEach((item, index) => {
      if (!item) return;

      const itemCenter = (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2);
      const distanceFromCenter = containerCenter - itemCenter;
      const angle = (distanceFromCenter / ITEM_HEIGHT) * 8; // Reduced from 20 for flatter iOS look
      const absDistance = Math.abs(distanceFromCenter);

      // iOS Clock shows 5-7 cards - much wider visibility
      const isVisible = absDistance <= ITEM_HEIGHT * 4; // Increased to show more cards

      item.style.transform = `rotateX(${angle}deg) translateZ(${RADIUS}px)`;
      item.style.zIndex = Math.round(100 - absDistance);
      item.style.visibility = isVisible ? 'visible' : 'hidden';

      // CRITICAL: Don't touch opacity - let isSelected styling show through
    });
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
    requestAnimationFrame(updateTransforms);
    if (isScrollingRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, products.length - 1));
    const targetProduct = products[clampedIndex];

    if (targetProduct && targetProduct.id !== lastSelectedRef.current) {
      if (!editingId) {
        lastSelectedRef.current = targetProduct.id;
        setSelectedProductId(targetProduct.id);
        playTickSound();
      }
    }
  };

  // Initial Setup
  useLayoutEffect(() => {
    updateTransforms();
    if (containerRef.current) {
      const index = products.findIndex(p => p.id === selectedProductId);
      if (index !== -1) {
        isScrollingRef.current = true;
        containerRef.current.scrollTop = index * ITEM_HEIGHT;
        setTimeout(() => isScrollingRef.current = false, 100);
        updateTransforms();
      }
    }
  }, []);

  // Sync external selection changes
  useEffect(() => {
    if (isScrollingRef.current || !containerRef.current || editingId) return;

    const index = products.findIndex(p => p.id === selectedProductId);
    if (index !== -1 && selectedProductId !== lastSelectedRef.current) {
      lastSelectedRef.current = selectedProductId;
      smoothScrollTo(containerRef.current, index * ITEM_HEIGHT, 50000);
    }
  }, [selectedProductId, products, editingId]);

  const startEditing = (productId: string, currentName: string) => {
    setEditingId(productId);
    setEditValue(currentName);
  };

  const saveEdit = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (editValue.trim() && editValue !== product?.name) {
      onRename(productId, editValue);
    }
    setEditingId(null);
  };

  return (
    <div className="relative h-[144px] w-full overflow-hidden select-none bg-transparent rounded-2xl">
      {/* Center Highlight Zone */}
      <div className="absolute top-[54px] left-0 right-14 h-[36px] z-0 pointer-events-none" />

      {/* Gradient Masks */}
      <div className="absolute top-0 left-0 right-14 h-4 bg-gradient-to-b from-apple-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-14 h-4 bg-gradient-to-t from-apple-bg to-transparent z-10 pointer-events-none" />

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory py-[54px] no-scrollbar relative z-20"
        onScroll={handleScroll}
        onTouchStart={() => cancelScrollAnimation()}
        onMouseDown={() => cancelScrollAnimation()}
        onWheel={() => cancelScrollAnimation()}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!containerRef.current || editingId) return;

          const rect = containerRef.current.getBoundingClientRect();
          const clickY = e.clientY - rect.top;
          const centerY = rect.height / 2;
          const currentIndex = products.findIndex(p => p.id === selectedProductId);

          // Click above center - go to previous card
          if (clickY < centerY - ITEM_HEIGHT / 2 && currentIndex > 0) {
            const targetIndex = currentIndex - 1;
            playTickSound();
            smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 50000);
          }
          // Click below center - go to next card
          else if (clickY > centerY + ITEM_HEIGHT / 2 && currentIndex < products.length - 1) {
            const targetIndex = currentIndex + 1;
            playTickSound();
            smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 50000);
          }
        }}
        style={{
          scrollBehavior: 'auto',
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
          {products.map((product, i) => {
            const isSelected = product.id === selectedProductId;
            const isEditing = editingId === product.id;

            return (
              <div
                key={product.id}
                ref={el => itemsRef.current[i] = el}
                className="h-[36px] flex items-center justify-center snap-center absolute top-0 left-0 right-14 will-change-transform backface-visibility-hidden"
                style={{ top: `${i * ITEM_HEIGHT}px` }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation(); // Prevent container onClick from interfering
                  if (!isEditing) {
                    setSelectedProductId(product.id);
                    playTickSound();
                  }
                }}
              >
                {/* Compact iOS Clock style cards */}
                <div className={`w-64 mx-3 px-5 py-2 rounded-full transition-all duration-200 flex items-center gap-3
                    ${isSelected ? 'justify-start' : 'justify-center'}
                    ${isSelected
                    ? 'bg-apple-red hover:bg-red-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-apple-gray hover:text-black'
                  }`}>

                  <ChefHat size={20} className={isSelected ? 'text-white' : 'text-apple-gray'} />

                  {isEditing ? (
                    <input
                      value={editValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(product.id)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && saveEdit(product.id)}
                      className="bg-transparent border-b border-white text-center w-40 outline-none text-base font-bold text-white"
                      autoFocus
                    />
                  ) : (
                    <span className={`tracking-tight cursor-pointer transition-all duration-200 
                            ${isSelected ? 'font-black text-lg' : 'font-medium text-base'}`}>
                      {product.name}
                    </span>
                  )}

                  {isSelected && !isEditing && (
                    <button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); startEditing(product.id, product.name); }}
                      className="p-1 text-white/80 hover:text-white transition-colors ml-auto"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ height: `${products.length * ITEM_HEIGHT}px` }} />
        </div>
      </div>

      {/* Gradient Masks */}
      <div className="absolute top-0 left-0 right-14 h-16 bg-gradient-to-b from-apple-bg to-transparent pointer-events-none z-30" />
      <div className="absolute bottom-0 left-0 right-14 h-16 bg-gradient-to-t from-apple-bg to-transparent pointer-events-none z-30" />
      {/* Navigation Buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-40">
        <button
          onClick={(e) => {
            e.stopPropagation();

            if (!containerRef.current || editingId) return;
            const currentIndex = products.findIndex(p => p.id === selectedProductId);
            if (currentIndex > 0) {
              const targetIndex = currentIndex - 1;
              playTickSound();
              smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 300);
            }
          }}
          className="p-2 rounded-full bg-[#ffb3ae] hover:bg-[#ff9a94] text-white shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={products.findIndex(p => p.id === selectedProductId) <= 0}
        >
          <ChevronUp size={20} strokeWidth={3} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!containerRef.current || editingId) return;
            const currentIndex = products.findIndex(p => p.id === selectedProductId);
            if (currentIndex < products.length - 1) {
              const targetIndex = currentIndex + 1;
              playTickSound();
              smoothScrollTo(containerRef.current, targetIndex * ITEM_HEIGHT, 300);
            }
          }}
          className="p-2 rounded-full bg-[#ffb3ae] hover:bg-[#ff9a94] text-white shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={products.findIndex(p => p.id === selectedProductId) >= products.length - 1}
        >
          <ChevronDown size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
