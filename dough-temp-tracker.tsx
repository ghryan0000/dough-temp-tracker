import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, TrendingUp, AlertCircle, Calculator, ChefHat, Package, Search, ChevronRight, BarChart3, Wind, Activity, Pencil, Check } from 'lucide-react';

export default function DoughTempTracker() {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('productNames');
    return saved ? JSON.parse(saved) : ['Sourdough', 'Baguette', 'Croissant', 'Pizza Dough', 'Challah', 'Focaccia'];
  });

  useEffect(() => {
    localStorage.setItem('productNames', JSON.stringify(products));
  }, [products]);

  const [currentProduct, setCurrentProduct] = useState(() => {
    const saved = localStorage.getItem('currentProduct');
    return saved || 'Sourdough';
  });

  const [targetTemp, setTargetTemp] = useState(25);
  const [bakes, setBakes] = useState(() => {
    const saved = localStorage.getItem('bakesData');
    if (saved) {
      const parsedBakes = JSON.parse(saved);
      // Data migration: add productType to existing bakes
      return parsedBakes.map(bake => ({ ...bake, productType: bake.productType || 'Sourdough' }));
    }
    return [
      { id: 1, productType: 'Sourdough', date: '2026-01-15', roomTemp: 22, flourTemp: 20, waterTemp: 30, levainTemp: 24, finalTemp: 25, mixTime: 5, hydration: 70 },
      { id: 2, productType: 'Sourdough', date: '2026-01-16', roomTemp: 23, flourTemp: 21, waterTemp: 28, levainTemp: 25, finalTemp: 24.5, mixTime: 6, hydration: 75 },
      { id: 3, productType: 'Sourdough', date: '2026-01-17', roomTemp: 21, flourTemp: 19, waterTemp: 32, levainTemp: 23, finalTemp: 25, mixTime: 5, hydration: 70 }
    ];
  });

  const handleRenameProduct = (index, newName) => {
    if (!newName.trim()) return;

    const oldName = products[index];
    if (oldName === newName) return;

    // 1. Update product list
    const newProducts = [...products];
    newProducts[index] = newName;
    setProducts(newProducts);

    // 2. Update all bakes with old product name
    const updatedBakes = bakes.map(bake =>
      bake.productType === oldName ? { ...bake, productType: newName } : bake
    );
    setBakes(updatedBakes);

    // 3. Update current selection if needed
    if (currentProduct === oldName) {
      setCurrentProduct(newName);
    }
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

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('bakesData', JSON.stringify(bakes));
  }, [bakes]);

  useEffect(() => {
    localStorage.setItem('currentProduct', currentProduct);
  }, [currentProduct]);

  const calculateRegression = () => {
    const validBakes = bakes.filter(b =>
      b.productType === currentProduct &&
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
  }, [bakes]);

  const addBake = () => {
    const newId = bakes.length > 0 ? Math.max(...bakes.map(b => b.id)) + 1 : 1;
    setBakes([...bakes, {
      id: newId, productType: currentProduct, date: new Date().toISOString().split('T')[0], roomTemp: '', flourTemp: '',
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
    const currentBakes = bakes.filter(b => b.productType === currentProduct);
    const headers = ['Date', 'Product', 'Room', 'Flour', 'Water', 'Levain', 'Final', 'Mix', 'Hydration', 'Friction'];
    const rows = currentBakes.map(b => [b.date, b.productType, b.roomTemp, b.flourTemp, b.waterTemp, b.levainTemp, b.finalTemp, b.mixTime, b.hydration, calculateSimpleFriction(b)]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dough-data-${currentProduct}.csv`;
    a.click();
  };

  const validBakesCount = bakes.filter(b =>
    b.productType === currentProduct &&
    b.roomTemp !== '' && b.flourTemp !== '' && b.waterTemp !== '' &&
    b.levainTemp !== '' && b.finalTemp !== '' && b.mixTime !== '' && b.hydration !== ''
  ).length;

  const currentBakes = bakes.filter(b => b.productType === currentProduct);
  const productCounts = products.map(product => ({
    name: product,
    count: bakes.filter(b => b.productType === product && b.roomTemp !== '').length
  }));

  // Jukebox rotation state
  const [rotation, setRotation] = useState(0);

  // Sync rotation with current product change (if clicked from outside or loaded)
  useEffect(() => {
    const index = products.indexOf(currentProduct);
    if (index !== -1) {
      setRotation(index * -60);
    }
  }, [currentProduct]);

  const handleJukeboxRotate = (direction) => {
    const newRotation = rotation + (direction === 'left' ? 60 : -60);
    setRotation(newRotation);

    // Determine closest product based on new rotation
    // normalize rotation to positive 0-360 range equivalent
    let normalized = Math.abs(newRotation / 60) % 6;
    if (newRotation > 0) normalized = (6 - normalized) % 6;

    const productIndex = Math.round(normalized) % 6;
    setCurrentProduct(products[productIndex]);
  };

  return (
    <div className="min-h-screen bg-apple-bg pt-6 pb-20 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header - Compact */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">My Bakery</h1>
            <p className="text-apple-gray text-xs font-medium">Temperature Tracker</p>
          </div>
          {regressionModel && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <Activity size={10} /> Model Ready
            </span>
          )}
        </div>

        {/* Main Content Grid: Product Selector (Jukebox) | Calculator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-start">

          {/* Left Column: Jukebox Selector (Tracker Item) */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full h-40 md:h-auto md:aspect-square relative perspective-1000 my-1 md:my-8">
              <JukeboxSelector
                products={products}
                currentProduct={currentProduct}
                rotation={rotation}
                setRotation={setRotation}
                setCurrentProduct={setCurrentProduct}
                productCounts={productCounts}
                onRename={handleRenameProduct}
              />
            </div>
            <p className="text-xs text-apple-gray mt-8 text-center">
              Drag or scroll to rotate • Click pencil to rename
            </p>
          </div>

          {/* Right Column: Calculator */}
          <div className="md:col-span-7 bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-black flex items-center gap-2">
                <Calculator size={18} className="text-apple-red" /> Calculator
              </h2>
            </div>

            {/* Inputs with Units */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Room Temp', key: 'roomTemp', unit: '°C' },
                { label: 'Flour Temp', key: 'flourTemp', unit: '°C' },
                { label: 'Levain Temp', key: 'levainTemp', unit: '°C' },
                { label: 'Mix Time', key: 'mixTime', unit: 'min' },
                { label: 'Target Temp', key: 'target', unit: '°C', value: targetTemp, setter: setTargetTemp },
                { label: 'Hydration', key: 'hydration', unit: '%' }
              ].map((field) => (
                <div key={field.label} className="bg-apple-bg rounded-lg px-3 py-2 relative group focus-within:ring-1 focus-within:ring-apple-red/50 transition-all">
                  <label className="text-[10px] font-semibold text-apple-gray absolute top-1.5 left-3">{field.label}</label>
                  <div className="flex items-baseline mt-4">
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
            <div className={`p-4 rounded-xl text-center transition-all ${regressionModel ? 'bg-gradient-to-br from-apple-red/5 to-white border border-apple-red/10' : 'bg-gray-50'}`}>
              <div className="text-[10px] font-bold text-apple-gray uppercase tracking-wider mb-1">TARGET WATER TEMP</div>
              <div className={`text-4xl font-black tracking-tighter ${currentPredictedWater ? 'text-apple-red' : 'text-gray-300'}`}>
                {currentPredictedWater !== null ? currentPredictedWater.toFixed(1) : '--'}
                <span className="text-lg ml-0.5 font-medium text-gray-400">°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-black">History ({currentProduct})</h2>
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
                <p className="text-sm">No sessions recorded for {currentProduct}</p>
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

      </div>
    </div>
  );
}

// Jukebox Carousel Component
function JukeboxSelector({ products, currentProduct, rotation, setRotation, setCurrentProduct, productCounts, onRename }) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Reduced radius for mobile compactness (was 120)
  const radius = 90;

  const handleMouseDown = (e) => {
    if (editingIndex !== null) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setStartRotation(rotation);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotation(startRotation + (deltaX * 0.5));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapRotation();
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (editingIndex !== null) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setStartRotation(rotation);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    setRotation(startRotation + (deltaX * 0.5));
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapRotation();
  };

  const snapRotation = () => {
    const snappedRotation = Math.round(rotation / 60) * 60;
    setRotation(snappedRotation);

    let normalizedIndex = Math.round(-snappedRotation / 60) % 6;
    if (normalizedIndex < 0) normalizedIndex += 6;
    setCurrentProduct(products[normalizedIndex]);
  };

  const handleFaceClick = (index) => {
    if (editingIndex !== null) return;
    const targetRotation = index * -60;
    setRotation(targetRotation);
    setCurrentProduct(products[index]);
  };

  const startEditing = (index, currentName) => {
    setEditingIndex(index);
    setEditValue(currentName);
  };

  const saveEdit = (index) => {
    if (editValue.trim() && editValue !== products[index]) {
      onRename(index, editValue);
    }
    setEditingIndex(null);
  };

  return (
    <div
      className="relative w-full h-full preserve-3d transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `rotateY(${rotation}deg)` }}
    >
      {products.map((product, index) => {
        const angle = index * 60;
        const isActive = product === currentProduct;
        const count = productCounts.find(p => p.name === product)?.count || 0;
        const isEditing = editingIndex === index;

        return (
          <div
            key={index}
            onClick={(e) => { e.stopPropagation(); !isEditing && handleFaceClick(index); }}
            className={`absolute top-0 left-0 right-0 mx-auto w-20 h-28 rounded-xl p-3 flex flex-col justify-between backface-hidden border transition-all duration-300 ${isActive
              ? 'bg-apple-red text-white shadow-xl shadow-red-200 border-transparent z-10'
              : 'bg-white text-gray-400 border-gray-100 shadow-sm opacity-90 hover:opacity-100'
              }`}
            style={{
              transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
            }}
          >
            <div className="flex justify-between items-start">
              <div className={`p-1.5 rounded-full w-fit ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                <ChefHat size={14} />
              </div>
              {isActive && !isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); startEditing(index, product); }}
                  className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
                >
                  <Pencil size={10} />
                </button>
              )}
            </div>

            <div>
              {isEditing ? (
                <div className="flex items-center gap-1 mb-1">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveEdit(index)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(index)}
                    className="w-full text-xs font-bold bg-white text-black rounded px-1 py-0.5 outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); saveEdit(index); }} className="text-white hover:text-green-200">
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div className="font-bold text-sm leading-tight mb-1 truncate" title={product}>{product}</div>
              )}
              <div className={`text-[8px] font-medium ${isActive ? 'text-white/80' : 'text-gray-300'}`}>
                {count} SESSIONS
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simple Activity Icon component since it was missing from Lucide import in previous step content
const ActivityIcon = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);