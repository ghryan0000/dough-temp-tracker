import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, TrendingUp, AlertCircle, Calculator, ChefHat, Package, Search, ChevronRight, BarChart3, Wind, Activity } from 'lucide-react';

export default function DoughTempTracker() {
  const productTypes = ['Sourdough', 'Baguette', 'Croissant', 'Pizza Dough', 'Challah', 'Focaccia'];

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
  const productCounts = productTypes.map(product => ({
    name: product,
    count: bakes.filter(b => b.productType === product && b.roomTemp !== '').length
  }));

  return (
    <div className="min-h-screen bg-apple-bg pb-20 font-sans">
      <div className="max-w-md mx-auto">

        {/* Header - Apple Music 'Library' style */}
        <div className="pt-14 pb-4 px-5">
          <h1 className="text-4xl font-bold text-black tracking-tight mb-1">My Bakery</h1>
          <p className="text-apple-gray text-lg font-medium">Temperature Tracker</p>
        </div>

        {/* Product Selector - Horizontal Scroll 'Albums' style */}
        <div className="mb-8">
          <div className="flex overflow-x-auto gap-3 px-5 pb-4 no-scrollbar snap-x">
            {productTypes.map((product) => {
              const productData = productCounts.find(p => p.name === product);
              const isActive = product === currentProduct;
              return (
                <button
                  key={product}
                  onClick={() => setCurrentProduct(product)}
                  className={`flex-none snap-center group relative overflow-hidden rounded-xl p-4 w-32 h-32 transition-all duration-300 ${isActive
                    ? 'bg-apple-red shadow-lg shadow-red-200 scale-100'
                    : 'bg-white shadow-sm hover:shadow-md'
                    }`}
                >
                  <div className={`absolute top-3 left-3 p-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <ChefHat size={20} className={isActive ? 'text-white' : 'text-apple-gray'} />
                  </div>
                  <div className="absolute bottom-3 left-3 text-left">
                    <div className={`font-bold text-lg leading-tight ${isActive ? 'text-white' : 'text-black'}`}>
                      {product}
                    </div>
                    <div className={`text-xs font-medium mt-1 ${isActive ? 'text-white/80' : 'text-apple-gray'}`}>
                      {productData?.count || 0} sessions
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calculator - 'Now Playing' Card Style */}
        <div className="px-5 mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xl font-bold text-black">Calculator</h2>
            {regressionModel && (
              <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                Model Ready
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Display Area */}
            <div className={`p-6 text-center border-b border-gray-100 ${regressionModel ? 'bg-gradient-to-b from-white to-gray-50' : 'bg-gray-50'
              }`}>
              <div className="text-xs font-bold text-apple-gray uppercase tracking-wider mb-2">TARGET WATER TEMP</div>
              <div className={`text-5xl font-bold tracking-tighter mb-2 ${currentPredictedWater ? 'text-apple-red' : 'text-gray-300'
                }`}>
                {currentPredictedWater !== null ? currentPredictedWater.toFixed(1) : '--'}
                <span className="text-2xl ml-1 text-gray-400">°C</span>
              </div>
              {!regressionModel && (
                <p className="text-xs text-apple-gray mt-2 flex items-center justify-center gap-1">
                  <AlertCircle size={12} />
                  Need {Math.max(0, 3 - validBakesCount)} more sessions
                </p>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Room Temp', key: 'roomTemp', icon: <Wind size={14} /> },
                  { label: 'Flour Temp', key: 'flourTemp', icon: <Package size={14} /> },
                  { label: 'Levain Temp', key: 'levainTemp', icon: <Activity size={14} /> },
                  { label: 'Mix Time', key: 'mixTime', isTime: true },
                  { label: 'Target Temp', key: 'target', value: targetTemp, setter: setTargetTemp },
                  { label: 'Hydration', key: 'hydration', isPercent: true }
                ].map((field) => (
                  <div key={field.label} className="bg-apple-bg rounded-xl p-3">
                    <label className="text-xs font-medium text-apple-gray mb-1 flex items-center gap-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={field.key === 'target' ? targetTemp : currentConditions[field.key]}
                      onChange={(e) => field.key === 'target' ? setTargetTemp(e.target.value) : updateCurrentCondition(field.key, e.target.value)}
                      className="w-full bg-transparent text-lg font-bold text-black outline-none p-0 placeholder-gray-300"
                      placeholder="--"
                    />
                  </div>
                ))}
              </div>
            </div>

            {regressionModel && (
              <button onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full py-4 text-sm font-medium text-apple-red hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <BarChart3 size={16} />
                {showAnalysis ? 'Hide' : 'Show'} Model Details
              </button>
            )}
          </div>

          {/* Analysis Drawer */}
          {showAnalysis && regressionModel && (
            <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-apple-gray uppercase mb-2">Equation Coefficients</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-apple-bg p-2 rounded-lg">
                      <span className="text-gray-500 text-xs">Room</span>
                      <div className="font-mono font-bold">{regressionModel.roomCoef.toFixed(2)}</div>
                    </div>
                    <div className="bg-apple-bg p-2 rounded-lg">
                      <span className="text-gray-500 text-xs">Flour</span>
                      <div className="font-mono font-bold">{regressionModel.flourCoef.toFixed(2)}</div>
                    </div>
                    <div className="bg-apple-bg p-2 rounded-lg">
                      <span className="text-gray-500 text-xs">Friction/Min</span>
                      <div className="font-mono font-bold text-orange-600">{Math.abs(regressionModel.mixTimeCoef).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-600">Model Accuracy (R²)</span>
                  <span className="font-bold text-green-600">{regressionModel.rSquared.toFixed(3)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History List - 'Songs' style */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xl font-bold text-black">History</h2>
            <button onClick={addBake} className="text-apple-red hover:bg-apple-red/10 p-2 rounded-full transition-colors">
              <Plus size={24} />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {currentBakes.length === 0 ? (
              <div className="p-8 text-center text-apple-gray">
                <p>No sessions recorded</p>
                <button onClick={addBake} className="mt-2 text-apple-red font-medium text-sm">Start your first bake</button>
              </div>
            ) : (
              currentBakes.slice().reverse().map((bake) => (
                <div key={bake.id} className="p-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-apple-bg flex items-center justify-center text-apple-gray font-bold text-xs flex-shrink-0">
                      {new Date(bake.date).getDate()}
                    </div>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={bake.date}
                        onChange={(e) => updateBake(bake.id, 'date', e.target.value)}
                        className="font-bold text-black bg-transparent outline-none w-full"
                      />
                      <div className="text-xs text-apple-gray flex gap-2">
                        <span>Target: {bake.finalTemp || '--'}°</span>
                        <span>•</span>
                        <span>Hydration: {bake.hydration || '--'}%</span>
                      </div>
                    </div>
                    <button onClick={() => deleteBake(bake.id)} className="text-gray-300 hover:text-apple-red p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Mini Input Grid for History Item */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <label className="text-[10px] text-gray-400 block">Room</label>
                      <input type="number" placeholder="--" className="w-full text-center text-sm font-medium bg-apple-bg rounded py-1 outline-none focus:ring-1 focus:ring-apple-red"
                        value={bake.roomTemp} onChange={(e) => updateBake(bake.id, 'roomTemp', e.target.value)} />
                    </div>
                    <div className="text-center">
                      <label className="text-[10px] text-gray-400 block">Flour</label>
                      <input type="number" placeholder="--" className="w-full text-center text-sm font-medium bg-apple-bg rounded py-1 outline-none focus:ring-1 focus:ring-apple-red"
                        value={bake.flourTemp} onChange={(e) => updateBake(bake.id, 'flourTemp', e.target.value)} />
                    </div>
                    <div className="text-center">
                      <label className="text-[10px] text-gray-400 block">Water</label>
                      <input type="number" placeholder="--" className="w-full text-center text-sm font-medium bg-apple-bg rounded py-1 outline-none focus:ring-1 focus:ring-apple-red"
                        value={bake.waterTemp} onChange={(e) => updateBake(bake.id, 'waterTemp', e.target.value)} />
                    </div>
                    <div className="text-center">
                      <label className="text-[10px] text-gray-400 block text-apple-red font-bold">Fri.</label>
                      <div className="text-sm font-bold text-apple-red py-1">{calculateSimpleFriction(bake)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button onClick={exportCSV} className="w-full mt-6 py-3 text-apple-gray text-sm font-medium flex items-center justify-center gap-2 hover:text-black transition-colors">
            <Download size={16} /> Export Data as CSV
          </button>
        </div>

      </div>
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