import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, TrendingUp, AlertCircle, Calculator, ChefHat, Package } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Product Selector */}
        <div className="bg-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={24} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Select Baking Product</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {productTypes.map((product) => {
              const productData = productCounts.find(p => p.name === product);
              const isActive = product === currentProduct;
              return (
                <button
                  key={product}
                  onClick={() => setCurrentProduct(product)}
                  className={`p-4 rounded-lg border-2 transition-all ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ChefHat size={20} className={isActive ? 'text-white' : 'text-indigo-600'} />
                  </div>
                  <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {product}
                  </div>
                  <div className={`text-xs mt-1 ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {productData?.count || 0} sessions
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-2xl p-6 text-white">\
          <div className="flex items-center gap-3 mb-4">
            <Calculator size={32} />
            <div>
              <h2 className="text-2xl font-bold">Water Temperature Calculator</h2>
              <p className="text-blue-100">Enter today's conditions to get your recommended water temperature</p>
            </div>
          </div>

          {regressionModel ? (
            <div className="bg-white/10 backdrop-blur rounded-lg p-5">
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Room (°C)</label>
                  <input type="number" step="0.1" value={currentConditions.roomTemp}
                    onChange={(e) => updateCurrentCondition('roomTemp', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white font-semibold" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Flour (°C)</label>
                  <input type="number" step="0.1" value={currentConditions.flourTemp}
                    onChange={(e) => updateCurrentCondition('flourTemp', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white font-semibold" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Levain (°C)</label>
                  <input type="number" step="0.1" value={currentConditions.levainTemp}
                    onChange={(e) => updateCurrentCondition('levainTemp', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white font-semibold" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mix (min)</label>
                  <input type="number" step="0.5" value={currentConditions.mixTime}
                    onChange={(e) => updateCurrentCondition('mixTime', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white font-semibold" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hydration (%)</label>
                  <input type="number" value={currentConditions.hydration}
                    onChange={(e) => updateCurrentCondition('hydration', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white font-semibold" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target (°C)</label>
                  <input type="number" step="0.1" value={targetTemp}
                    onChange={(e) => setTargetTemp(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white font-semibold" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <div className="text-gray-600 text-sm font-medium mb-2">USE THIS WATER TEMPERATURE:</div>
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {currentPredictedWater !== null ? currentPredictedWater.toFixed(1) : '-'}°C
                </div>
                <div className="text-gray-500 text-sm">
                  Based on {regressionModel.nSamples} sessions (R² = {regressionModel.rSquared.toFixed(3)})
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <AlertCircle size={48} className="mx-auto mb-3 opacity-70" />
              <p className="text-lg font-medium">Calculator Not Available Yet</p>
              <p className="text-blue-100 mt-2">Add at least 3 complete baking sessions below to enable prediction</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Training Your Model</h1>
          <p className="text-gray-600 mb-4">Record your baking sessions to train the prediction model</p>

          <div className={`mb-4 p-3 rounded-lg border ${regressionModel ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`mt-0.5 ${regressionModel ? 'text-green-600' : 'text-blue-600'}`} size={18} />
              <div className="text-sm">
                <strong>Status:</strong> {debugInfo || 'Waiting for data...'}
                <br />
                <strong>Sessions:</strong> {validBakesCount}
                {validBakesCount < 3 && <span className="text-orange-600"> (Need 3+ to enable calculator)</span>}
              </div>
            </div>
          </div>

          {regressionModel && (
            <div className="mt-4">
              <button onClick={() => setShowAnalysis(!showAnalysis)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md font-semibold">
                <TrendingUp size={20} /> {showAnalysis ? 'Hide' : 'Show'} Model Details
              </button>

              {showAnalysis && (
                <div className="mt-4 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-300">
                  <h3 className="font-bold text-xl mb-4 text-purple-900">📊 Regression Equation</h3>
                  <div className="font-mono text-sm bg-white p-4 rounded-lg border-2 border-purple-200 mb-5 overflow-x-auto">
                    Water = {regressionModel.intercept.toFixed(2)}
                    {regressionModel.roomCoef >= 0 ? ' + ' : ' − '}{Math.abs(regressionModel.roomCoef).toFixed(2)}×Room
                    {regressionModel.flourCoef >= 0 ? ' + ' : ' − '}{Math.abs(regressionModel.flourCoef).toFixed(2)}×Flour
                    {regressionModel.levainCoef >= 0 ? ' + ' : ' − '}{Math.abs(regressionModel.levainCoef).toFixed(2)}×Levain
                    {regressionModel.targetCoef >= 0 ? ' + ' : ' − '}{Math.abs(regressionModel.targetCoef).toFixed(2)}×Target
                    {regressionModel.mixTimeCoef >= 0 ? ' + ' : ' − '}{Math.abs(regressionModel.mixTimeCoef).toFixed(2)}×Mix
                    {regressionModel.hydrationCoef >= 0 ? ' + ' : ' − '}{Math.abs(regressionModel.hydrationCoef).toFixed(2)}×Hydration
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold mb-3 text-purple-900">🔢 Coefficients</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between py-1 bg-orange-50 px-2 rounded">
                          <span className="font-bold">🔥 Friction/min:</span>
                          <span className="font-mono font-bold text-orange-700">{regressionModel.mixTimeCoef.toFixed(3)}</span>
                        </li>
                        <li className="flex justify-between py-1 bg-blue-50 px-2 rounded">
                          <span className="font-bold">💧 Hydration/%:</span>
                          <span className="font-mono font-bold text-blue-700">{regressionModel.hydrationCoef.toFixed(3)}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold mb-3 text-purple-900">📈 Quality</h4>
                      <ul className="space-y-2 text-sm">
                        <li><strong>R²:</strong> <span className="font-mono text-lg">{regressionModel.rSquared.toFixed(3)}</span></li>
                        <li><strong>Fit:</strong> {
                          regressionModel.rSquared > 0.9 ? '✅ Excellent' :
                            regressionModel.rSquared > 0.7 ? '✅ Good' : '⚠️ Fair'
                        }</li>
                        <li><strong>Samples:</strong> {regressionModel.nSamples}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Baking Sessions (Training Data)</h2>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                <Download size={18} /> Export
              </button>
              <button onClick={addBake} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                <Plus size={18} /> Add
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2">
                  <th className="px-3 py-2 text-left text-sm">Date</th>
                  <th className="px-3 py-2 text-left text-sm">Room</th>
                  <th className="px-3 py-2 text-left text-sm">Flour</th>
                  <th className="px-3 py-2 text-left text-sm">Water</th>
                  <th className="px-3 py-2 text-left text-sm">Levain</th>
                  <th className="px-3 py-2 text-left text-sm">Final</th>
                  <th className="px-3 py-2 text-left text-sm">Mix</th>
                  <th className="px-3 py-2 text-left text-sm">Hydration</th>
                  <th className="px-3 py-2 text-left text-sm">Friction</th>
                  <th className="px-3 py-2 text-left text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {currentBakes.map((bake) => (
                  <tr key={bake.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input type="date" value={bake.date} onChange={(e) => updateBake(bake.id, 'date', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.1" value={bake.roomTemp} onChange={(e) => updateBake(bake.id, 'roomTemp', e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.1" value={bake.flourTemp} onChange={(e) => updateBake(bake.id, 'flourTemp', e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.1" value={bake.waterTemp} onChange={(e) => updateBake(bake.id, 'waterTemp', e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.1" value={bake.levainTemp} onChange={(e) => updateBake(bake.id, 'levainTemp', e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.1" value={bake.finalTemp} onChange={(e) => updateBake(bake.id, 'finalTemp', e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.5" value={bake.mixTime} onChange={(e) => updateBake(bake.id, 'mixTime', e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={bake.hydration} onChange={(e) => updateBake(bake.id, 'hydration', e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-amber-700">{calculateSimpleFriction(bake)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => deleteBake(bake.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}