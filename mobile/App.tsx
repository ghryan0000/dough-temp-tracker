import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, History } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Shared Core
import { useRegressionModel } from './src/hooks/useRegression';
import { predictWaterTemp } from './src/utils/baking';
import { Bake, Product } from './src/types';
import { loadBakes, saveBakes, loadProducts, saveProducts } from './src/utils/storage';

export default function App() {
  const [bakes, setBakes] = useState<Bake[]>([]);
  const [products, setProducts] = useState<Product[]>([{ id: 1, name: 'Country Sourdough', color: 'bg-amber-500' }]);
  const [selectedProductId, setSelectedProductId] = useState(1);

  // Inputs
  const [target, setTarget] = useState('25');
  const [room, setRoom] = useState('22');
  const [flour, setFlour] = useState('20');
  const [levain, setLevain] = useState('24');
  const [mix, setMix] = useState('5');
  const [hydration, setHydration] = useState('70');

  // Load Data
  useEffect(() => {
    const init = async () => {
      const savedBakes = await loadBakes();
      if (savedBakes.length > 0) setBakes(savedBakes);

      const savedProducts = await loadProducts();
      if (savedProducts.length > 0) setProducts(savedProducts);
    };
    init();
  }, []);

  const regressionModel = useRegressionModel(bakes, selectedProductId);
  const result = predictWaterTemp(regressionModel, room, flour, levain, target, mix, hydration);

  const handleAddSession = async () => {
    if (!result) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Simulate a full "Bake" entry using current inputs + predicted water
    const newBake: Bake = {
      id: Date.now(),
      productId: selectedProductId,
      date: new Date().toISOString().split('T')[0],
      roomTemp: room,
      flourTemp: flour,
      levainTemp: levain,
      waterTemp: result.toFixed(1), // Assume we used the predicted temp
      finalTemp: target, // Assume we hit the target
      mixTime: mix,
      hydration: hydration
    };

    const updatedBakes = [newBake, ...bakes];
    setBakes(updatedBakes);
    await saveBakes(updatedBakes);
    Alert.alert("Session Saved", "Bake added to model training!");
  };

  const handleClearHistory = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Clear History", "Delete all training data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          setBakes([]);
          await saveBakes([]);
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        style={styles.headerBackground}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>

            {/* Header Content */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Ryan's Bakery</Text>
              <Text style={styles.headerSubtitle}>Pro Water Temp Tracker</Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Calculator color="#dc2626" size={24} />
                <Text style={styles.cardTitle}>Calculator</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target FD Temp (°C)</Text>
                <TextInput style={styles.mainInput} keyboardType="numeric" value={target} onChangeText={setTarget} />
              </View>

              <View style={styles.grid}>
                <View style={styles.col}>
                  <Text style={styles.label}>Room</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={room} onChangeText={setRoom} placeholder="22" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Flour</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={flour} onChangeText={setFlour} placeholder="20" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Levain</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={levain} onChangeText={setLevain} placeholder="24" />
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.col}>
                  <Text style={styles.label}>Mix Min</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={mix} onChangeText={setMix} placeholder="5" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Hydr %</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={hydration} onChangeText={setHydration} placeholder="70" />
                </View>
              </View>

              {/* Result Area */}
              <View style={styles.divider} />

              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Suggested Water Temp</Text>
                <Text style={[styles.resultValue, { color: result ? '#dc2626' : '#9ca3af' }]}>
                  {result ? `${result.toFixed(1)}°C` : '--'}
                </Text>
              </View>

            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddSession}>
              <Plus color="#fff" size={20} />
              <Text style={styles.buttonText}>Add Session & Train Model</Text>
            </TouchableOpacity>

            {/* Model Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <History color="#666" size={16} />
                <Text style={styles.statText}>Model Trained on {regressionModel.nSamples} Sessions</Text>
              </View>
              <Text style={styles.statSub}>Reliability (R²): {regressionModel.rSquared.toFixed(2)}</Text>

              {bakes.length > 0 && (
                <TouchableOpacity onPress={handleClearHistory} style={{ marginTop: 10 }}>
                  <Text style={{ color: 'red', fontSize: 12 }}>Clear History</Text>
                </TouchableOpacity>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 20,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },
  primaryButton: {
    backgroundColor: '#1f2937',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  statSub: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
